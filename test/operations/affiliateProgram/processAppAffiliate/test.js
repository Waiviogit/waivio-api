const { processAppAffiliate } = require('utilities/operations/affiliateProgram/processAffiliate');
const makeAffiliateLinks = require('utilities/operations/affiliateProgram/makeAffiliateLinks');
const {
  expect, dropDatabase, sinon, faker, dropRedisDb,
} = require('test/testHelper');
const {
  AppFactory, ObjectFactory,
} = require('test/factories');
const { STATUSES } = require('constants/sitesConstants');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const { COUNTRY_TO_CONTINENT, GLOBAL_GEOGRAPHY } = require('constants/affiliateData');
const rewire = require('rewire');
const {
  createFieldsForAffiliate,
  createAffiliateGeoArea,
  createAffiliateCode,
  createAffiliateUrlTemplate,
  createAffiliateProductIdTypes,
} = require('../helper');
const redis = require('../../../../utilities/redis/redis');
const asyncLocalStorage = require('../../../../middlewares/context/context');

const myModule = rewire('utilities/operations/affiliateProgram/makeAffiliateLinks');
const getAffiliateCode = myModule.__get__('getAffiliateCode');

describe('On affiliate program', async () => {
  let currentApp, result, storeStub;

  before(async () => {
    await redis.setupRedisConnections();
  });

  beforeEach(async () => {
    await dropDatabase();
    currentApp = await AppFactory.Create({
      status: STATUSES.ACTIVE,
      host: 'waiviotest.com',
    });

    asyncLocalStorage.run(new Map(), () => {
      const store = asyncLocalStorage.getStore();
      store.set('host', currentApp.host);

      storeStub = sinon.stub(asyncLocalStorage, 'getStore').returns(store);
    });
  });
  afterEach(async () => {
    sinon.restore();
    storeStub.restore();
    await dropRedisDb();
  });

  describe('Process Affiliate App', async () => {
    beforeEach(async () => {
      await ObjectFactory.Create({
        fields: createFieldsForAffiliate(),
        objectType: OBJECT_TYPES.AFFILIATE,
      });
      await ObjectFactory.Create({
        fields: [
          ...createFieldsForAffiliate(),
          createAffiliateGeoArea({ body: 'EUROPE' }),
        ],
        objectType: OBJECT_TYPES.AFFILIATE,
      });
    });

    it('should choose object with US', async () => {
      const countryCode = 'US';

      result = await processAppAffiliate({
        app: currentApp,
        countryCode,
      });

      for (const resultEl of result) {
        const expected = resultEl.affiliateGeoArea.includes(countryCode);
        expect(expected).to.be.eq(true);
      }
    });

    it('should choose continent with country PL', async () => {
      const countryCode = 'PL';
      const continent = COUNTRY_TO_CONTINENT[countryCode];

      result = await processAppAffiliate({
        app: currentApp,
        countryCode,
      });

      for (const resultEl of result) {
        const expected = resultEl.affiliateGeoArea.includes(continent);
        expect(expected).to.be.eq(true);
      }
    });

    it('should choose continent with Global geography', async () => {
      const countryCode = 'VU';

      result = await processAppAffiliate({
        app: currentApp,
        countryCode,
      });

      for (const resultEl of result) {
        const expected = resultEl.affiliateGeoArea.includes(GLOBAL_GEOGRAPHY);
        expect(expected).to.be.eq(true);
      }
    });
  });

  describe('on make Affiliate links', async () => {
    const countryCode = 'US';
    const affiliateCode = faker.random.string();
    const affiliateType = faker.random.string();
    const productId = faker.random.string();
    const template = 'https://amazon.com/dp/$productId/ref=?$affiliateCode';
    const productIds = [{
      body: JSON.stringify({ productId, productIdType: affiliateType }),
    }];

    beforeEach(async () => {
      await ObjectFactory.Create({
        fields: [
          ...createFieldsForAffiliate(),
          createAffiliateCode({
            body: JSON.stringify([currentApp.host, affiliateCode]),
            weight: 100,
            creator: currentApp.owner,
          }),
          createAffiliateUrlTemplate({
            body: template,
            weight: 100,
          }),
          createAffiliateProductIdTypes({
            body: affiliateType,
            weight: 100,
          }),
        ],
        objectType: OBJECT_TYPES.AFFILIATE,
      });
    });

    it('should form proper Link', async () => {
      const expectedLink = `https://amazon.com/dp/${productId}/ref=?${affiliateCode}`;
      const affiliateLinks = await processAppAffiliate({
        app: currentApp,
        countryCode,
      });

      result = makeAffiliateLinks({
        affiliateCodes: affiliateLinks,
        productIds,
      });

      expect(result[0].link).to.be.eq(expectedLink);
    });

    it('with exact host', async () => {
      const exactId = faker.random.string();
      const expectedLink = `https://amazon.com/dp/${exactId}/ref=?${affiliateCode}`;
      const affiliateLinks = await processAppAffiliate({
        app: currentApp,
        countryCode,
      });

      result = makeAffiliateLinks({
        affiliateCodes: affiliateLinks,
        productIds: [...productIds, {
          body: JSON.stringify({ productId: exactId, productIdType: 'amazon.com' }),
        }],
      });

      expect(result[0].link).to.be.eq(expectedLink);
    });
  });

  describe('getAffiliateCode Function Tests', () => {
    it('should return an empty string for an empty array', () => {
      expect(getAffiliateCode([])).to.equal('');
    });

    it('should return an empty string for an array with fewer than two elements', () => {
      expect(getAffiliateCode(['onlyone'])).to.equal('');
    });

    it('should return the second element if array length is exactly 2', () => {
      expect(getAffiliateCode(['first', 'second'])).to.equal('second');
    });

    it('should handle valid input with proper chance distribution', () => {
      const input = ['luxitasolutions.com', 'luxitasolutions::30', 'test::70'];
      const counts = { luxitasolutions: 0, test: 0 };
      const runs = 10000;

      for (let i = 0; i < runs; i++) {
        const result = getAffiliateCode(input);
        if (result in counts) counts[result]++;
      }

      const luxitasPercentage = (counts.luxitasolutions / runs) * 100;
      const testPercentage = (counts.test / runs) * 100;

      // Allowing a margin of error due to randomness
      expect(luxitasPercentage).to.be.closeTo(30, 2);
      expect(testPercentage).to.be.closeTo(70, 2);
    });

    it('should return an empty string for invalid input (non-numeric chance)', () => {
      const input = ['luxitasolutions.com', 'luxitasolutions::abc', 'test::70'];
      expect(getAffiliateCode(input)).to.equal('');
    });

    it('should return an empty string if any chance is negative', () => {
      const input = ['luxitasolutions.com', 'luxitasolutions::-10', 'test::110'];
      expect(getAffiliateCode(input)).to.equal('');
    });

    it('should correctly use provided chances when they sum to 100', () => {
      const input = ['luxitasolutions.com', 'luxitasolutions::30', 'test::50', 'extra::20'];
      const counts = { luxitasolutions: 0, test: 0, extra: 0 };
      const runs = 10000;

      for (let i = 0; i < runs; i++) {
        const result = getAffiliateCode(input);
        if (result in counts) counts[result]++;
      }

      const luxitasPercentage = (counts.luxitasolutions / runs) * 100;
      const testPercentage = (counts.test / runs) * 100;
      const extraPercentage = (counts.extra / runs) * 100;

      // Allowing a margin of error due to randomness
      expect(luxitasPercentage).to.be.closeTo(30, 1);
      expect(testPercentage).to.be.closeTo(50, 1);
      expect(extraPercentage).to.be.closeTo(20, 1);
    });

    it('should return an empty string if all chances sum to zero', () => {
      const input = ['luxitasolutions.com', 'luxitasolutions::0', 'test::0'];
      expect(getAffiliateCode(input)).to.equal('');
    });
  });
});
