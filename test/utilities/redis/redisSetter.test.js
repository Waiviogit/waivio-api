const { expect } = require('chai');
const sinon = require('sinon');
const Redis = require('ioredis-mock');

// Mock Redis clients
const mockRedisClients = {
  importUserClient: new Redis(),
  mainFeedsCacheClient: new Redis(),
  tagCategoriesClient: new Redis(),
  appUsersStatistics: new Redis(),
  processedPostClient: new Redis(),
};

// Mock the redis module
const redisMock = {
  ...mockRedisClients,
};

const proxyquire = require('proxyquire').noCallThru();

const redisSetter = proxyquire('../../../utilities/redis/redisSetter', {
  './redis': redisMock,
});

describe('RedisSetter', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('addTopWobjUsers', () => {
    it('should add top wobject users', async () => {
      const saddStub = sandbox.stub(mockRedisClients.mainFeedsCacheClient, 'sadd').resolves(1);

      await redisSetter.addTopWobjUsers('test-permlink', ['user1', 'user2']);

      expect(saddStub.calledOnce).to.be.true;
    });
  });

  describe('addSiteActiveUser', () => {
    it('should add active user', async () => {
      const saddStub = sandbox.stub(mockRedisClients.appUsersStatistics, 'sadd').resolves(1);

      await redisSetter.addSiteActiveUser('test-key', '127.0.0.1');

      expect(saddStub.calledOnce).to.be.true;
    });
  });

  describe('Feed Cache Operations', () => {
    const testData = {
      ids: ['post1', 'post2'],
      locale: 'en-US',
      app: 'testApp',
    };

    beforeEach(() => {
      sandbox.stub(mockRedisClients.mainFeedsCacheClient, 'del').resolves();
      sandbox.stub(mockRedisClients.mainFeedsCacheClient, 'rpush').resolves();
    });

    it('should update trend feed cache', async () => {
      await redisSetter.updateTrendLocaleFeedCache(testData);
      expect(mockRedisClients.mainFeedsCacheClient.del.calledOnce).to.be.true;
      expect(mockRedisClients.mainFeedsCacheClient.rpush.calledOnce).to.be.true;
    });

    it('should update filtered trend feed cache', async () => {
      await redisSetter.updateFilteredTrendLocaleFeedCache(testData);
      expect(mockRedisClients.mainFeedsCacheClient.del.calledOnce).to.be.true;
      expect(mockRedisClients.mainFeedsCacheClient.rpush.calledOnce).to.be.true;
    });

    it('should update hot feed cache', async () => {
      await redisSetter.updateHotLocaleFeedCache(testData);
      expect(mockRedisClients.mainFeedsCacheClient.del.calledOnce).to.be.true;
      expect(mockRedisClients.mainFeedsCacheClient.rpush.calledOnce).to.be.true;
    });
  });

  describe('Tag Operations', () => {
    it('should add tag category', async () => {
      const zaddStub = sandbox.stub(mockRedisClients.tagCategoriesClient, 'zadd').resolves(1);

      await redisSetter.addTagCategory({
        categoryName: 'test',
        tags: ['tag1', 'tag2'],
      });

      expect(zaddStub.calledOnce).to.be.true;
    });

    it('should increment tag', async () => {
      const zincrbyStub = sandbox.stub(mockRedisClients.tagCategoriesClient, 'zincrby').resolves(1);

      await redisSetter.incrementTag({
        categoryName: 'test',
        tag: 'tag1',
        objectType: 'test',
      });

      expect(zincrbyStub.calledOnce).to.be.true;
    });
  });

  describe('Website Operations', () => {
    it('should increment website suspended count', async () => {
      sandbox.stub(mockRedisClients.appUsersStatistics, 'incr').resolves(1);
      sandbox.stub(mockRedisClients.appUsersStatistics, 'expire').resolves(1);

      const result = await redisSetter.incrementWebsitesSuspended({
        key: 'test',
        expire: 3600,
      });

      expect(result).to.equal(1);
    });
  });

  describe('Hash Operations', () => {
    it('should set hash data', async () => {
      sandbox.stub(mockRedisClients.importUserClient, 'hset').resolves(1);

      const result = await redisSetter.hmsetAsync({
        key: 'test',
        data: { field1: 'value1' },
      });

      expect(result.result).to.equal(1);
    });
  });

  describe('Basic Operations', () => {
    it('should set key value', async () => {
      sandbox.stub(mockRedisClients.mainFeedsCacheClient, 'set').resolves('OK');

      const result = await redisSetter.set({
        key: 'test',
        value: 'value',
      });

      expect(result).to.equal('OK');
    });

    it('should set key with expiry', async () => {
      sandbox.stub(mockRedisClients.mainFeedsCacheClient, 'set').resolves('OK');

      const result = await redisSetter.setEx({
        key: 'test',
        ttl: 3600,
        value: 'value',
      });

      expect(result).to.equal('OK');
    });
  });

  describe('Multi Operations', () => {
    it('should handle zincrby with expire', async () => {
      const multiStub = {
        zincrby: sandbox.stub().returnsThis(),
        expire: sandbox.stub().returnsThis(),
        exec: sandbox.stub().resolves(),
      };
      sandbox.stub(mockRedisClients.appUsersStatistics, 'multi').returns(multiStub);

      await redisSetter.zincrbyExpire({
        key: 'test',
        increment: 1,
        member: 'test',
        ttl: 3600,
      });

      expect(multiStub.exec.calledOnce).to.be.true;
    });
  });
});
