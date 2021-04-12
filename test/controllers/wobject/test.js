const _ = require('lodash');
const {
  faker, chai, expect, dropDatabase, sinon, app, App,
} = require('test/testHelper');
const {
  AppFactory, RelatedFactory, AppendObjectFactory, PostFactory, ObjectFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { OBJECT_TYPES } = require('constants/wobjectsData');

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
            user_languages: ['en-US'],
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
            user_languages: ['en-US'],
          })
          .set({ origin: inheritedApp.host });

        expect(result.status).to.be.eq(404);
      });

      it('should not return post not in supported types', async () => {
        await App.updateOne({ host: inheritedApp.host },
          { $set: { supported_object_types: [faker.random.string()] } });
        result = await chai.request(app)
          .post(`/api/wobject/${wobj.wobject.author_permlink}/posts`)
          .send({
            newsPermlink: wobj.appendObject.permlink,
            user_languages: ['en-US'],
          })
          .set({ origin: inheritedApp.host });

        expect(result.status).to.be.eq(404);
      });
    });
  });
});
