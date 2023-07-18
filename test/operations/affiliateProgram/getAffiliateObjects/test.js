const { getAffiliateObjects } = require('utilities/operations/affiliateProgram/getAffiliateObjects');
const {
  expect, dropDatabase, sinon, faker,
} = require('test/testHelper');
const {
  AppFactory, ObjectFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const {
  createFieldsForAffiliate, createAffiliateCode,
} = require('../helper');

describe('On affiliate program', async () => {
  let currentApp, session;
  beforeEach(async () => {
    await dropDatabase();
    currentApp = await AppFactory.Create({
      status: STATUSES.ACTIVE,
      host: 'waiviotest.com',
      authority: [faker.random.string()],
    });
    session = getNamespace('request-session');
    sinon.stub(session, 'get').returns(currentApp.host);
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('on personal', async () => {
    let result;
    const userName = faker.random.string();
    const affiliateCode = faker.random.string();

    beforeEach(async () => {
      await ObjectFactory.Create({
        fields: createFieldsForAffiliate(),
        objectType: OBJECT_TYPES.AFFILIATE,
        ownership: currentApp.authority,
      });

      await ObjectFactory.Create({
        fields: [
          ...createFieldsForAffiliate(),
          createAffiliateCode({
            body: JSON.stringify(['PERSONAL', affiliateCode]),
            weight: 100,
            creator: userName,
          }),
        ],
        objectType: OBJECT_TYPES.AFFILIATE,
      });

      ({
        result,
      } = await getAffiliateObjects({ app: currentApp, userName }));
    });

    it('result should contain 2 objects', async () => {
      expect(result.length).to.be.eq(2);
    });

    it('result should contain object with user code', async () => {
      const usercode = result.find((el) => el.userCode);
      const code = JSON.parse(usercode.affiliateCode);

      expect(code[1]).to.be.eq(affiliateCode);
    });
  });

  describe('on sites', async () => {
    let result;
    const userName = faker.random.string();
    const affiliateCode = faker.random.string();
    const host = faker.internet.domainName();

    beforeEach(async () => {
      await ObjectFactory.Create({
        fields: createFieldsForAffiliate(),
        objectType: OBJECT_TYPES.AFFILIATE,
        ownership: currentApp.authority,
      });

      await ObjectFactory.Create({
        fields: [
          ...createFieldsForAffiliate(),
          createAffiliateCode({
            body: JSON.stringify([host, affiliateCode]),
            weight: 100,
            creator: userName,
          }),
        ],
        objectType: OBJECT_TYPES.AFFILIATE,
      });

      ({
        result,
      } = await getAffiliateObjects({ app: currentApp, userName, host }));
    });

    it('result should contain 2 objects', async () => {
      expect(result.length).to.be.eq(2);
    });

    it('result should contain object with user code', async () => {
      const usercode = result.find((el) => el.userCode);
      const code = JSON.parse(usercode.affiliateCode);

      expect(code[1]).to.be.eq(affiliateCode);
    });
  });
});
