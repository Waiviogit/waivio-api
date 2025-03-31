const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('Redis Getter', () => {
  let sandbox;
  let redisGetter;
  let redisClients;
  let jsonHelper;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Mock all redis clients
    redisClients = {
      wobjRefsClient: { hgetall: sandbox.stub() },
      importUserClient: {
        keys: sandbox.stub(),
        get: sandbox.stub(),
        hgetall: sandbox.stub(),
        zrange: sandbox.stub(),
        ttl: sandbox.stub(),
      },
      mainFeedsCacheClient: {
        lrange: sandbox.stub(),
        get: sandbox.stub(),
        keys: sandbox.stub(),
      },
      tagCategoriesClient: { zrange: sandbox.stub() },
      appUsersStatistics: { smembers: sandbox.stub(), del: sandbox.stub() },
      processedPostClient: { sismember: sandbox.stub() },
    };

    // Mock jsonHelper
    jsonHelper = {
      parseJson: sandbox.stub(),
    };

    // Mock the constants
    const constants = {
      HOT_NEWS_CACHE_PREFIX: 'hot-news',
      HOT_NEWS_CACHE_SIZE: 100,
      TREND_NEWS_CACHE_SIZE: 100,
      TREND_NEWS_CACHE_PREFIX: 'trending',
    };

    // Use proxyquire to inject our mocks including constants
    redisGetter = proxyquire('../../../utilities/redis/redisGetter', {
      './redis': redisClients,
      '../helpers/jsonHelper': jsonHelper,
      '../../constants/postsData': constants,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getWobjRefs', () => {
    it('should get wobject refs by author permlink', async () => {
      const mockRefs = { ref1: '10', ref2: '20' };
      redisClients.wobjRefsClient.hgetall.resolves(mockRefs);

      const result = await redisGetter.getWobjRefs('author_permlink');
      expect(result).to.deep.equal(mockRefs);
      expect(redisClients.wobjRefsClient.hgetall.calledWith('author_permlink')).to.be.true;
    });
  });

  describe('getHotFeedCache', () => {
    it('should get hot feed with default params', async () => {
      const mockIds = ['id1', 'id2'];
      redisClients.mainFeedsCacheClient.lrange.resolves(mockIds);

      const result = await redisGetter.getHotFeedCache({});
      expect(result).to.deep.equal({ ids: mockIds });
      expect(redisClients.mainFeedsCacheClient.lrange.calledWith('hot-news:en-US', 0, -1)).to.be.true;
    });

    it('should get hot feed with custom app and locale', async () => {
      const mockIds = ['id1', 'id2'];
      redisClients.mainFeedsCacheClient.lrange.resolves(mockIds);

      const result = await redisGetter.getHotFeedCache({ app: 'testApp', locale: 'ru-RU' });
      expect(result).to.deep.equal({ ids: mockIds });
      expect(redisClients.mainFeedsCacheClient.lrange.calledWith('testApp:hot-news:ru-RU', 0, -1)).to.be.true;
    });

    it('should return error if limit exceeds max size', async () => {
      const result = await redisGetter.getHotFeedCache({ limit: 101 });
      expect(result).to.have.property('error');
      expect(result.error).to.include('should be less than 100');
    });
  });

  describe('getTrendFeedCache', () => {
    it('should get trend feed with default params', async () => {
      const mockIds = ['id1', 'id2'];
      redisClients.mainFeedsCacheClient.lrange.resolves(mockIds);

      const result = await redisGetter.getTrendFeedCache({});
      expect(result).to.deep.equal({ ids: mockIds });
      expect(redisClients.mainFeedsCacheClient.lrange.calledWith('trending:en-US', 0, -1)).to.be.true;
    });

    it('should get trend feed with custom app prefix', async () => {
      const mockIds = ['id1', 'id2'];
      redisClients.mainFeedsCacheClient.lrange.resolves(mockIds);

      const result = await redisGetter.getTrendFeedCache({ app: 'testApp', locale: 'ru-RU' });
      expect(result).to.deep.equal({ ids: mockIds });
      expect(redisClients.mainFeedsCacheClient.lrange.calledWith('testApp:trending:ru-RU', 0, -1)).to.be.true;
    });

    it('should get trend feed with custom prefix', async () => {
      const mockIds = ['id1', 'id2'];
      redisClients.mainFeedsCacheClient.lrange.resolves(mockIds);

      const result = await redisGetter.getTrendFeedCache({ prefix: 'custom-prefix' });
      expect(result).to.deep.equal({ ids: mockIds });
      expect(redisClients.mainFeedsCacheClient.lrange.calledWith('custom-prefix:en-US', 0, -1)).to.be.true;
    });

    it('should return error if limit exceeds max size', async () => {
      const result = await redisGetter.getTrendFeedCache({ limit: 101 });
      expect(result).to.have.property('error');
      expect(result.error).to.include('should be less than 100');
    });
  });

  describe('getTagCategories', () => {
    it('should get tag categories successfully', async () => {
      const mockTags = ['tag1', 'tag2'];
      redisClients.tagCategoriesClient.zrange.resolves(mockTags);

      const result = await redisGetter.getTagCategories({ key: 'testKey', start: 0, end: -1 });
      expect(result).to.deep.equal({ tags: mockTags });
    });

    it('should handle errors', async () => {
      redisClients.tagCategoriesClient.zrange.rejects(new Error('Redis error'));

      const result = await redisGetter.getTagCategories({ key: 'testKey', start: 0, end: -1 });
      expect(result).to.have.property('error');
    });
  });

  describe('zrangeWithScores', () => {
    it('should format zrange results correctly', async () => {
      const mockResult = ['member1', '1.5', 'member2', '2.5'];
      redisClients.importUserClient.zrange.resolves(mockResult);

      const result = await redisGetter.zrangeWithScores({ key: 'testKey', start: 0, end: -1 });
      expect(result).to.deep.equal([
        { member: 'member1', score: 1.5 },
        { member: 'member2', score: 2.5 },
      ]);
    });
  });

  describe('getFromCache', () => {
    it('should parse and return cached JSON data', async () => {
      const mockData = { key: 'value' };
      redisClients.mainFeedsCacheClient.get.resolves(JSON.stringify(mockData));
      jsonHelper.parseJson.returns(mockData);

      const result = await redisGetter.getFromCache({ key: 'testKey' });
      expect(result).to.deep.equal(mockData);
    });

    it('should return undefined for invalid JSON', async () => {
      redisClients.mainFeedsCacheClient.get.resolves('invalid json');
      jsonHelper.parseJson.returns(null);

      const result = await redisGetter.getFromCache({ key: 'testKey' });
      expect(result).to.be.undefined;
    });
  });
});
