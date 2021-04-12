const _ = require('lodash');
const {
  faker, chai, expect, dropDatabase, sinon, app, App, Post, moment,
} = require('test/testHelper');
const {
  AppFactory, RelatedFactory, AppendObjectFactory, PostFactory, ObjectFactory,
  HiddenPostsFactory, MutedUsersFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { OBJECT_TYPES } = require('constants/wobjectsData');
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

  describe('On /wobject/:authorPermlink/posts', async () => {
    let wobj, post, postWobj, inheritedApp;
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
    describe('with typeList newFilter for inherited apps', async () => {
      beforeEach(async () => {
        sinon.restore();
        postWobj = await ObjectFactory.Create({ objectType: OBJECT_TYPES.RESTAURANT });
        inheritedApp = await AppFactory.Create({
          status: STATUSES.ACTIVE,
          supportedObjects: [postWobj.author_permlink],
          supportedTypes: [OBJECT_TYPES.RESTAURANT],
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
      });
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
        await App.updateOne({ host: inheritedApp.host },
          { $set: { supported_object_types: [faker.random.string()] } });
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
          .send({
            newsPermlink: wobj.appendObject.permlink,
          })
          .set({ origin: inheritedApp.host });
        expect(result.body).to.be.an('array').that.is.empty;
      });
    });
  });
});
