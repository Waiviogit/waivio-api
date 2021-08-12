const _ = require('lodash');
const {
  dropDatabase, expect, sinon, faker,
} = require('test/testHelper');
const { getNamespace } = require('cls-hooked');
const { Prefetch } = require('test/testHelper');
const searchHelper = require('utilities/helpers/searchHelper');
const { AppFactory, PrefetchFactory } = require('test/factories');
const {
  showAllPrefetches, getPrefetchList, updatePrefetchList, createPrefetch,
} = require('utilities/operations/sites/prefetchWobjs');

describe('On prefetchWobjs.js', async () => {
  let countPrefetches, appInfo;
  const data = { type: 'restaurant' };
  beforeEach(async () => {
    await dropDatabase();
  });
  describe('On showAllPrefs', async () => {
    beforeEach(async () => {
      countPrefetches = _.random(1, 10);
      for (let i = 0; i < countPrefetches; i++) {
        await PrefetchFactory.Create({ type: data.type });
      }
    });
    it('should return all prefetches', async () => {
      const { result } = await showAllPrefetches(data);
      expect(result).to.have.length(countPrefetches);
    });
  });

  describe('On getPrefetchList', async () => {
    appInfo = { prefetches: ['Vancouver Restaurants', 'Richmond Dishes', 'Penticton Restaurants'] };
    beforeEach(async () => {
      await dropDatabase();
      await PrefetchFactory.Create({ name: appInfo.prefetches[0], type: data.type });
      await PrefetchFactory.Create({ name: appInfo.prefetches[1], type: data.type });
      await PrefetchFactory.Create({ name: appInfo.prefetches[2], type: 'dish' });
      sinon.stub(searchHelper, 'getAppInfo').returns(appInfo);
    });
    afterEach(() => {
      sinon.restore();
    });
    it('should return prefetches by app & object_type', async () => {
      const { result } = await getPrefetchList(
        { name: { $in: appInfo.prefetches }, type: data.type },
      );
      expect(result).to.have.length(2);
    });
    it('should return an empty array if prefetches by the given criteria are not found', async () => {
      const { result } = await getPrefetchList(
        { name: { $in: [faker.random.string()] }, type: faker.random.string() },
      );
      expect(result).to.be.empty;
    });
  });
  describe('On updatePrefetchList', async () => {
    let app, owner;
    beforeEach(async () => {
      countPrefetches = _.random(1, 10);
      owner = faker.random.string();
      await PrefetchFactory.Create({ name: 'French Cuisine', type: data.type });
      await PrefetchFactory.Create({ name: 'Vegan Options', type: data.type });

      app = await AppFactory.Create({
        prefetches: ['Vancouver Restaurants', 'Richmond Dishes', 'Penticton Restaurants'], owner, admins: [owner],
      });
      const session = getNamespace('request-session');
      sinon.stub(session, 'get').returns(app.host);
    });
    afterEach(() => {
      sinon.restore();
    });
    it('should return updated prefetch list by app', async () => {
      const prefetches = { names: ['French Cuisine', 'Vegan Options'], userName: owner };
      const { result } = await updatePrefetchList(prefetches);
      expect(result.names).to.be.deep.eq(prefetches.names);
    });
    it('should return error if prefetch not found', async () => {
      const prefetches = { names: [faker.random.string()] };
      const { error } = await updatePrefetchList(prefetches);
      expect(error).to.be.deep.eq({ status: 404, message: 'Prefetches not found!' });
    });
  });
  describe('On createPrefetch', async () => {
    let prefetch;
    const tag = faker.random.string();
    const category = faker.random.string();
    const createParams = {
      name: 'French Cuisine', tag, type: data.type, category,
    };
    beforeEach(async () => {
      await dropDatabase();
      prefetch = (await createPrefetch(createParams)).result;
    });
    it('should return created prefetch', async () => {
      expect(_.omit(prefetch, ['_id', '__v'])).to.be.deep.eq(
        { ...createParams, route: `type=${data.type}&${category}=${tag}` },
      );
    });
    it('should have added prefetch to db', async () => {
      const { result } = await Prefetch.findOne(createParams);
      expect(_.omit(result, ['_id', '__v'])).to.be.deep.eq(
        { ...createParams, route: `type=${data.type}&${category}=${tag}` },
      );
    });
  });
});
