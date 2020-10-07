const { faker, expect, sinon } = require('test/testHelper');
const Sentry = require('@sentry/node');
const { STATUSES } = require('constants/sitesConstants');
const { AppFactory, WebsitePaymentsFactory } = require('test/factories');

describe('on collectSiteDebts', async () => {
  describe('on dailyDebt', async () => {
    let parent;
    beforeEach(async () => {
      sinon.stub(Sentry, 'captureException').returns('Ok');
      parent = await AppFactory.Create({ inherited: false, canBeExtended: true });
    });
    afterEach(async () => {
      sinon.restore();
    });
    describe('on OK', async () => {
      let app;
      beforeEach(async () => {
        const name = faker.random.string();
        app = await AppFactory.Create({ host: `${name}.${parent.host}`, status: STATUSES.ACTIVE });
      });
    });

    describe('on error', async () => {

    });
  });
});
