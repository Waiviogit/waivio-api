const _ = require('lodash');
const {
  faker, chai, expect, dropDatabase, sinon, app, UserWobjectsModel,
} = require('test/testHelper');
const {
  AppFactory, RelatedFactory, UserWobjectsFactory, AppendObjectFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');

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
      authorPermlink = faker.random.string(100);
      newsFilterPermlink = faker.random.string(100);
      allowObjectPermlinks = faker.random.string(100);

      await AppendObjectFactory.Create({
        rootWobj: authorPermlink,
        permlink: newsFilterPermlink,
        body: JSON.stringify({ allowList: [[allowObjectPermlinks]] }),
      });

      for (let i = 0; i < _.random(10, 15); i++) {
        await UserWobjectsFactory.Create({
          authorPermlink,
          weight: _.random(1, 10000),
        });
      }
      for (let i = 0; i < _.random(10, 15); i++) {
        await UserWobjectsFactory.Create({
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
  });
});
