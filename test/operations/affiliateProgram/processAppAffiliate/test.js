const { processAppAffiliate } = require('utilities/operations/affiliateProgram/processAffiliate');
const makeAffiliateLinks = require('utilities/operations/affiliateProgram/makeAffiliateLinks');
const {
  expect, dropDatabase, sinon, faker,
} = require('test/testHelper');
const {
  AppFactory, ObjectFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const { COUNTRY_TO_CONTINENT, GLOBAL_GEOGRAPHY } = require('constants/affiliateData');
const {
  createFieldsForAffiliate, createAffiliateGeoArea, createAffiliateCode, createAffiliateUrlTemplate, createAffiliateProductIdTypes,
} = require('./helper');

describe('On affiliate program', async () => {
  let currentApp, session, result;
  beforeEach(async () => {
    await dropDatabase();
    currentApp = await AppFactory.Create({
      status: STATUSES.ACTIVE,
      host: 'waiviotest.com',
    });
    session = getNamespace('request-session');
    sinon.stub(session, 'get').returns(currentApp.host);
  });
  afterEach(() => {
    sinon.restore();
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
          createAffiliateGeoArea({ body: JSON.stringify(['GLOBAL', 'EUROPE', 'UA']) }),
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
          }),
          createAffiliateUrlTemplate({
            body: template,
            weight: 100,
          }),
          createAffiliateProductIdTypes({
            body: JSON.stringify([affiliateType]),
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
        affiliateLinks,
        productIds,
      });
      console.log();
      expect(result[0].link).to.be.eq(expectedLink);
    });
  });
});
