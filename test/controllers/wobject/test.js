const _ = require('lodash');
const { EXPERTS_SORT } = require('constants/sortData');
const {
  faker, chai, expect, dropDatabase, sinon, app, UserWobjectsModel, App, Post, moment, WObject,
} = require('test/testHelper');
const {
  AppFactory, RelatedFactory, UserWobjectsFactory, AppendObjectFactory, PostFactory, ObjectFactory,
  HiddenPostsFactory, MutedUsersFactory, UsersFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { OBJECT_TYPES, FIELDS_NAMES } = require('constants/wobjectsData');
const { ObjectId } = require('mongoose').Types;

describe('On wobjController', async () => {
  let currentApp, session, result;
  beforeEach(async () => {
    await dropDatabase();
    currentApp = await AppFactory.Create({ status: STATUSES.ACTIVE });
    session = getNamespace('request-session');
    sinon.stub(session, 'get').returns(currentApp.host);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('On related', async () => {
    describe('On ok', async () => {
      let count, wobjAuthorPermlink, limit, skip;
      beforeEach(async () => {
        wobjAuthorPermlink = faker.random.string();
        count = _.random(10, 15);
        limit = _.random(1, 9);
        for (let i = 0; i < count; i++) {
          await RelatedFactory.Create({ wobjAuthorPermlink });
        }
        result = await chai.request(app)
          .get(`/api/wobject/${wobjAuthorPermlink}/related`)
          .query({ limit });
      });

      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should return right count of docs', async () => {
        expect(result.body.count).to.be.eq(count);
      });
      it('should return right length of items with limit', async () => {
        expect(result.body.items).to.have.length(limit);
      });
      it('should return hasMore true with limit', async () => {
        expect(result.body.hasMore).to.be.true;
      });
      it('should return hasMore false with limit', async () => {
        result = await chai.request(app)
          .get(`/api/wobject/${wobjAuthorPermlink}/related`)
          .query({ limit: count });
        expect(result.body.hasMore).to.be.false;
      });
      it('should return right length of items with skip', async () => {
        result = await chai.request(app)
          .get(`/api/wobject/${wobjAuthorPermlink}/related`)
          .query({ skip: count - 1 });
        expect(result.body.items).to.have.length(1);
      });
      it('should return hasMore false with skip', async () => {
        result = await chai.request(app)
          .get(`/api/wobject/${wobjAuthorPermlink}/related`)
          .query({ skip: count - 1 });
        expect(result.body.hasMore).to.be.false;
      });
      it('should return hasMore true with skip', async () => {
        limit = parseInt(count / 2, 10);
        skip = parseInt(limit / 2, 10);
        result = await chai.request(app)
          .get(`/api/wobject/${wobjAuthorPermlink}/related`)
          .query({ limit, skip });
        expect(result.body.hasMore).to.be.true;
      });
    });
    describe('On no photos in album', async () => {
      beforeEach(async () => {
        result = await chai.request(app)
          .get(`/api/wobject/${faker.random.string()}/related`);
      });
      it('should items be empty array', async () => {
        expect(result.body.items).to.be.empty;
      });
      it('should count be 0', async () => {
        expect(result.body.count).to.be.eq(0);
      });
      it('should hasMore to be false', async () => {
        expect(result.body.hasMore).to.be.false;
      });
    });
    describe('On error', async () => {
      it('should return status 422', async () => {
        result = await chai.request(app)
          .get(`/api/wobject/${faker.random.string()}/related`)
          .query({ limit: faker.random.string() });
        expect(result).to.have.status(422);
      });
    });
  });

  describe('On objectExpertise', async () => {
    let skip, limit, authorPermlink, newsFilterPermlink, allowObjectPermlinks;
    beforeEach(async () => {
      await dropDatabase();
      skip = _.random(1, 3);
      limit = _.random(6, 9);
      authorPermlink = faker.random.string(20);
      newsFilterPermlink = faker.random.string(20);
      allowObjectPermlinks = faker.random.string(20);

      await AppendObjectFactory.Create({
        name: faker.random.string(20),
        rootWobj: authorPermlink,
        permlink: newsFilterPermlink,
        body: JSON.stringify({ allowList: [[allowObjectPermlinks]] }),
      });

      for (let i = 0; i < _.random(15, 25); i++) {
        const userWobj = await UserWobjectsFactory.Create({
          id: new ObjectId(moment().subtract(i, 'minute').unix()),
          userName: faker.random.string(20),
          authorPermlink,
          weight: _.random(1, 10000),
        });
        await UsersFactory.Create({
          name: userWobj.user_name,
          followers_count: _.random(0, 100),
        });
      }
      for (let i = 0; i < _.random(15, 25); i++) {
        await UserWobjectsFactory.Create({
          userName: faker.random.string(20),
          authorPermlink: allowObjectPermlinks,
          weight: _.random(1, 10000),
        });
      }
    });
    it('should return a sorted array of "newsFilter" experts and be equal to the returned from MongoDB', async () => {
      const mongoExpertsNames = [];
      const resultExpertsNames = [];

      const pipeline = [
        { $match: { author_permlink: allowObjectPermlinks } },
        { $sort: { weight: -1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      const { result: mongoData } = await UserWobjectsModel.aggregate(pipeline);
      for (const data of mongoData) {
        mongoExpertsNames.push(data.user_name);
      }

      result = await chai.request(app)
        .post(`/api/wobject/${authorPermlink}/object_expertise`).send({ limit, skip, newsFilter: newsFilterPermlink });
      for (const data of result.body.users) {
        resultExpertsNames.push(data.name);
      }
      expect(resultExpertsNames).to.have.members(mongoExpertsNames);
    });
    it('should return an array of experts whose weight is sorted in descending order', async () => {
      result = await chai.request(app)
        .post(`/api/wobject/${authorPermlink}/object_expertise`).send({ limit, skip });
      expect(result.body.users[0].weight).to.be
        .greaterThan(result.body.users[result.body.users.length - 1].weight);
    });
    it('should return an array of experts whose length must be equal to the "limit"', async () => {
      result = await chai.request(app)
        .post(`/api/wobject/${authorPermlink}/object_expertise`).send({ limit, skip });
      expect(result.body.users).to.have.length(limit);
    });
    it('should return status 200', async () => {
      result = await chai.request(app)
        .post(`/api/wobject/${authorPermlink}/object_expertise`).send({ limit, skip });
      expect(result).to.have.status(200);
    });
    it('should return status 422 on validation error', async () => {
      result = await chai.request(app)
        .post(`/api/wobject/${faker.random.string()}/object_expertise`).send({
          limit: faker.random.string(), skip: faker.random.string(),
        });
      expect(result).to.have.status(422);
    });
    it('should return a sorted array by weight', async () => {
      result = await chai.request(app)
        .post(`/api/wobject/${authorPermlink}/object_expertise`)
        .send({ limit, skip, sort: EXPERTS_SORT.RANK });
      expect(result.body.users[0].weight).to.be
        .greaterThan(result.body.users[result.body.users.length - 1].weight);
    });
    it('should return a sorted array by alphabet', async () => {
      result = await chai.request(app)
        .post(`/api/wobject/${authorPermlink}/object_expertise`)
        .send({ limit, skip, sort: EXPERTS_SORT.ALPHABET });
      expect(result.body.users[result.body.users.length - 1].name
        .localeCompare(result.body.users[0].name))
        .to.be.eq(1);
    });
    it('should return a sorted array by number of subscribers of the expert', async () => {
      result = await chai.request(app)
        .post(`/api/wobject/${authorPermlink}/object_expertise`)
        .send({ limit, skip, sort: EXPERTS_SORT.FOLLOWERS });
      expect(result.body.users[0].followers_count).to.be
        .greaterThan(result.body.users[result.body.users.length - 1].followers_count);
    });
    it('should return a sorted array by creation time', async () => {
      result = await chai.request(app)
        .post(`/api/wobject/${authorPermlink}/object_expertise`)
        .send({ limit, skip, sort: EXPERTS_SORT.RECENCY });
      expect(ObjectId(result.body.users[0]._id).getTimestamp()).to.be
        .greaterThan(ObjectId(result.body.users[result.body.users.length - 1]._id).getTimestamp());
    });
  });

  describe('On /wobject/:authorPermlink/posts', async () => {
    let wobj, post, postWobj, inheritedApp, extendededApp, rulePost, ruleWobj;
    const userName = faker.random.string();

    describe('on req without newsFilter', async () => {
      beforeEach(async () => {
        wobj = await ObjectFactory.Create({ objectType: _.sample(OBJECT_TYPES) });
        post = await PostFactory.Create({
          wobjects: [{ author_permlink: wobj.author_permlink, object_type: wobj.object_type }],
        });
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.author_permlink}/posts`);
      });

      it('should have status 200', async () => {
        expect(result.status).to.be.eq(200);
      });
      it('should show proper posts', async () => {
        const { body: [resPost] } = result;
        expect({ author: post.author, permlink: post.permlink })
          .to.be.deep.eq({ author: resPost.author, permlink: resPost.permlink });
      });
      it('should show posts by wobject author_permlink', async () => {
        const { body: [resPost] } = result;
        expect(resPost.wobjects[0].author_permlink).to.be.eq(wobj.author_permlink);
      });
      it('should not return reblogs', async () => {
        await Post.updateOne(
          { _id: post._id },
          { reblog_to: { author: faker.random.string(), permlink: faker.random.string() } },
        );
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.author_permlink}/posts`);
        expect(result.body).to.be.an('array').that.is.empty;
      });
      it('should not return post blocked for apps', async () => {
        await Post.updateOne(
          { _id: post._id },
          { blocked_for_apps: currentApp.host },
        );
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.author_permlink}/posts`);
        expect(result.body).to.be.an('array').that.is.empty;
      });

      it('should return error if object doesn\'t exist', async () => {
        result = await chai.request(app)
          .post(`/api/wobject/${faker.random.string()}/posts`);
        expect(result.status).to.be.eq(404);
      });
      it('should not return post if user hide it', async () => {
        await HiddenPostsFactory.Create({ userName, postId: post._id });
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.author_permlink}/posts`)
          .set({ follower: userName });

        expect(result.body).to.be.an('array').that.is.empty;
      });
      it('should not return post if user mute author', async () => {
        await MutedUsersFactory.Create({ mutedBy: userName, userName: post.author });
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.author_permlink}/posts`)
          .set({ follower: userName });

        expect(result.body).to.be.an('array').that.is.empty;
      });
      it('should return olderPost post if lastId as parametr', async () => {
        const olderPost = await PostFactory.Create({
          additionsForPost: { _id: new ObjectId(moment().subtract(7, 'days').unix()) },
          wobjects: [{ author_permlink: wobj.author_permlink }],
        });
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.author_permlink}/posts`)
          .send({ lastId: post._id.toString() });
        const { body: [resPost] } = result;
        expect({ author: olderPost.author, permlink: olderPost.permlink })
          .to.be.deep.eq({ author: resPost.author, permlink: resPost.permlink });
      });
      it('should not return post not supported languages', async () => {
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.author_permlink}/posts`)
          .send({ user_languages: ['pl-PL'] });

        expect(result.body).to.be.an('array').that.is.empty;
      });
    });
    describe('with typeList newFilter', async () => {
      beforeEach(async () => {
        sinon.restore();
        postWobj = await ObjectFactory.Create({ objectType: OBJECT_TYPES.RESTAURANT });
        inheritedApp = await AppFactory.Create({
          status: STATUSES.ACTIVE,
          supportedObjects: [postWobj.author_permlink],
          supportedTypes: [OBJECT_TYPES.RESTAURANT],
        });
        extendededApp = await AppFactory.Create({
          status: STATUSES.ACTIVE,
          supportedTypes: [OBJECT_TYPES.RESTAURANT],
          canBeExtended: true,
          inherited: false,
        });
        wobj = await AppendObjectFactory.Create({
          body: JSON.stringify({
            allowList: [[]],
            ignoreList: [],
            typeList: [OBJECT_TYPES.RESTAURANT],
          }),
        });
        post = await PostFactory.Create({
          wobjects: [{
            author_permlink: postWobj.author_permlink,
            object_type: postWobj.object_type,
          }],
        });
        ruleWobj = await ObjectFactory.Create({ objectType: OBJECT_TYPES.CRYPTO });
        rulePost = await PostFactory.Create({
          wobjects: [{
            author_permlink: ruleWobj.author_permlink,
            object_type: ruleWobj.object_type,
          }],
        });
      });
      describe('for inherited apps', async () => {
        it('should response post has required object type', async () => {
          result = await chai.request(app)
            .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
            .send({
              newsPermlink: wobj.appendObject.permlink,
            })
            .set({ origin: inheritedApp.host });
          const { body: [resPost] } = result;
          expect(resPost.wobjects[0].object_type).to.be.eq(postWobj.object_type);
        });
        it('should not return post if it not in supportedObjects', async () => {
          await App.updateOne({ host: inheritedApp.host }, { $set: { supported_objects: [] } });
          result = await chai.request(app)
            .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
            .send({
              newsPermlink: wobj.appendObject.permlink,
            })
            .set({ origin: inheritedApp.host });
          expect(result.body).to.be.an('array').that.is.empty;
        });
        it('should not return post not in supported types', async () => {
          await App.updateOne(
            { host: inheritedApp.host },
            { $set: { supported_object_types: [faker.random.string()] } },
          );
          result = await chai.request(app)
            .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
            .send({
              newsPermlink: wobj.appendObject.permlink,
            })
            .set({ origin: inheritedApp.host });
          expect(result.body).to.be.an('array').that.is.empty;
        });
        it('should not return post if in ignore list', async () => {
          await WObject.updateOne(
            {
              author_permlink: wobj.wobject.author_permlink,
              'fields.author': wobj.appendObject.author,
              'fields.permlink': wobj.appendObject.permlink,
            },
            {
              $set: {
                'fields.$.body': JSON.stringify({
                  allowList: [[]],
                  ignoreList: [postWobj.author_permlink],
                  typeList: [OBJECT_TYPES.RESTAURANT],
                }),
              },
            },
          );

          result = await chai.request(app)
            .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
            .send({
              newsPermlink: wobj.appendObject.permlink,
            })
            .set({ origin: inheritedApp.host });
          expect(result.body).to.be.an('array').that.is.empty;
        });
      });
      describe('with rule', async () => {
        beforeEach(async () => {
          await WObject.updateOne(
            {
              author_permlink: wobj.wobject.author_permlink,
              'fields.author': wobj.appendObject.author,
              'fields.permlink': wobj.appendObject.permlink,
            },
            {
              $set: {
                'fields.$.body': JSON.stringify({
                  allowList: [[ruleWobj.author_permlink]],
                  ignoreList: [],
                  typeList: [OBJECT_TYPES.RESTAURANT],
                }),
              },
            },
          );
          result = await chai.request(app)
            .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
            .send({
              newsPermlink: wobj.appendObject.permlink,
            })
            .set({ origin: inheritedApp.host });
        });
        it('should find rule post even if it not ins supported types', async () => {
          const { body: [post1] } = result;
          expect(post1._id).to.be.eq(rulePost._id.toString());
        });
        it('should rule post be in not supported listTypes', async () => {
          const { body: [post1] } = result;
          expect(post1.wobjects[0].object_type).to.be.eq(OBJECT_TYPES.CRYPTO);
        });
        it('should has typeList results', async () => {
          const { body: [, post2] } = result;
          expect(post2._id).to.be.eq(post._id.toString());
        });
        it('should has typeList objectType', async () => {
          const { body: [, post2] } = result;
          expect(post2.wobjects[0].object_type).to.be.eq(OBJECT_TYPES.RESTAURANT);
        });
      });
      describe('for extended apps', async () => {
        it('should response post has required object type', async () => {
          result = await chai.request(app)
            .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
            .send({
              newsPermlink: wobj.appendObject.permlink,
            })
            .set({ origin: extendededApp.host });
          const { body: [resPost] } = result;
          expect(resPost.wobjects[0].object_type).to.be.eq(postWobj.object_type);
        });
        it('should not return post if in ignore list', async () => {
          await WObject.updateOne(
            {
              author_permlink: wobj.wobject.author_permlink,
              'fields.author': wobj.appendObject.author,
              'fields.permlink': wobj.appendObject.permlink,
            },
            {
              $set: {
                'fields.$.body': JSON.stringify({
                  allowList: [[]],
                  ignoreList: [postWobj.author_permlink],
                  typeList: [OBJECT_TYPES.RESTAURANT],
                }),
              },
            },
          );

          result = await chai.request(app)
            .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
            .send({
              newsPermlink: wobj.appendObject.permlink,
            })
            .set({ origin: extendededApp.host });
          expect(result.body).to.be.an('array').that.is.empty;
        });
        it('should not return post not in supported types', async () => {
          await App.updateOne(
            { host: extendededApp.host },
            { $set: { supported_object_types: [faker.random.string()] } },
          );
          result = await chai.request(app)
            .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
            .send({
              newsPermlink: wobj.appendObject.permlink,
            })
            .set({ origin: extendededApp.host });
          expect(result.body).to.be.an('array').that.is.empty;
        });
        describe('with rule', async () => {
          beforeEach(async () => {
            await WObject.updateOne(
              {
                author_permlink: wobj.wobject.author_permlink,
                'fields.author': wobj.appendObject.author,
                'fields.permlink': wobj.appendObject.permlink,
              },
              {
                $set: {
                  'fields.$.body': JSON.stringify({
                    allowList: [[ruleWobj.author_permlink]],
                    ignoreList: [],
                    typeList: [OBJECT_TYPES.RESTAURANT],
                  }),
                },
              },
            );
            result = await chai.request(app)
              .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
              .send({
                newsPermlink: wobj.appendObject.permlink,
              })
              .set({ origin: extendededApp.host });
          });
          it('should find rule post even if it not ins supported types', async () => {
            const { body: [post1] } = result;
            expect(post1._id).to.be.eq(rulePost._id.toString());
          });
          it('should rule post be in not supported listTypes', async () => {
            const { body: [post1] } = result;
            expect(post1.wobjects[0].object_type).to.be.eq(OBJECT_TYPES.CRYPTO);
          });
          it('should has typeList results', async () => {
            const { body: [, post2] } = result;
            expect(post2._id).to.be.eq(post._id.toString());
          });
          it('should has typeList objectType', async () => {
            const { body: [, post2] } = result;
            expect(post2.wobjects[0].object_type).to.be.eq(OBJECT_TYPES.RESTAURANT);
          });
        });
      });
    });
  });

  describe('On countWobjectsByArea', async () => {
    let myApp;
    const countVacouverWobjects = _.random(1, 50);
    const countRichmondWobjects = _.random(1, 50);
    const countPentictonWobjects = _.random(1, 50);
    beforeEach(async () => {
      await dropDatabase();
      myApp = await AppFactory.Create({
        status: STATUSES.ACTIVE,
        configuration: {
          availableCities: [
            { city: 'Vancouver', route: faker.random.string() },
            { city: 'Richmond', route: faker.random.string() },
            { city: 'Penticton', route: faker.random.string() },
          ],
        },
      });
      sinon.restore();
      sinon.stub(session, 'get').returns(myApp.host);

      for (let i = 0; i < countVacouverWobjects; i++) {
        await ObjectFactory.Create({
          fields: [{ name: FIELDS_NAMES.ADDRESS, body: '{"city":"Vancouver","country":"Canada"}' }], objectType: 'restaurant',
        });
      }
      for (let i = 0; i < countRichmondWobjects; i++) {
        await ObjectFactory.Create({
          fields: [{ name: FIELDS_NAMES.ADDRESS, body: '{"city":"Richmond","country":"Canada"}' }], objectType: 'restaurant',
        });
      }
      for (let i = 0; i < countPentictonWobjects; i++) {
        await ObjectFactory.Create({
          fields: [{ name: FIELDS_NAMES.ADDRESS, body: '{"city":"Penticton","country":"Canada"}' }], objectType: 'restaurant',
        });
      }
      result = await chai.request(app).get('/api/wobject/count/by-area')
        .query({ objectType: 'restaurant' }).set({ Origin: myApp.host });
    });
    it('should return an array of cities with correct counters', () => {
      const actual = _.map(result.body, (wobject) => _.omit(wobject, ['route', '_id']));
      expect(actual).to.be.deep.eq([
        { city: 'Vancouver', counter: countVacouverWobjects },
        { city: 'Richmond', counter: countRichmondWobjects },
        { city: 'Penticton', counter: countPentictonWobjects },
      ]);
    });
  });

  describe('On checkIfObjectExists', async () => {
    let wobj;

    beforeEach(async () => {
      await dropDatabase();
      wobj = await ObjectFactory.Create({});
    });

    it('should return true if wobject is found by provided authorPermlink', async () => {
      result = await chai.request(app)
        .get(`/api/wobject/${wobj.author_permlink}/exist`);
      expect(result.body).to.be.deep.eq({ exist: true });
    });

    it('should return false if wobject is not found by provided authorPermlink', async () => {
      result = await chai.request(app)
        .get(`/api/wobject/${faker.random.string()}/exist`);
      expect(result.body).to.be.deep.eq({ exist: false });
    });
  });
});
