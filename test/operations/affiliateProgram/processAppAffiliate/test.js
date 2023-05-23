const _ = require('lodash');
const { processAppAffiliate } = require('utilities/operations/affiliateProgram/processAffiliate');
const {
  faker, chai, expect, dropDatabase, sinon, app, UserWobjectsModel, App, Post, moment, WObject,
} = require('test/testHelper');
const {
  AppFactory, RelatedFactory, UserWobjectsFactory, AppendObjectFactory, PostFactory, ObjectFactory,
  HiddenPostsFactory, MutedUsersFactory, UsersFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { OBJECT_TYPES, FIELDS_NAMES } = require('constants/wobjectsData');
const { createFieldsForAffiliate } = require('./helper');

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

  describe('Process Affiliate', async () => {
    beforeEach(async () => {
      await ObjectFactory.Create({
        fields: createFieldsForAffiliate(),
        objectType: OBJECT_TYPES.AFFILIATE,
      });
    });

    it('should ', async () => {
      const yo = await processAppAffiliate({
        app: currentApp,
        countryCode: 'US',
      });
    });
  });
});
