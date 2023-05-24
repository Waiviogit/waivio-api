const { processAppAffiliate } = require('utilities/operations/affiliateProgram/processAffiliate');
const {
  expect, dropDatabase, sinon,
} = require('test/testHelper');
const {
  AppFactory, ObjectFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const { COUNTRY_TO_CONTINENT, GLOBAL_GEOGRAPHY } = require('constants/affiliateData');
const { createFieldsForAffiliate, createAffiliateGeoArea } = require('./helper');

describe('On affiliate program', async () => {
  let currentApp, session, result;
  beforeEach(async () => {
    await dropDatabase();
    currentApp = await AppFactory.Create({
      status: STATUSES.ACTIVE,
      host: 'waivio.com',
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
});
