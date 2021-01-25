const {
  faker, expect, dropDatabase, _, App,
} = require('test/testHelper');
const { PAYMENT_TYPES } = require('constants/sitesConstants');
const { AppFactory, WebsitePaymentsFactory } = require('test/factories');
const reports = require('utilities/operations/sites/reports');

describe('On report.js', async () => {
  describe('On getReport when user delete his site', async () => {
    let beforeDelete, afterDelete, beforeDeleteHost, afterDeleteHost;
    beforeEach(async () => {
      await dropDatabase();
      const owner = faker.random.string();
      const newOwner = faker.random.string();
      const app = await AppFactory.Create({ owner });
      const { host } = app;
      const amount = _.random(5, 10);
      await WebsitePaymentsFactory.Create({ name: owner, amount });
      for (let i = 0; i < amount - 1; i++) {
        await WebsitePaymentsFactory.Create({
          name: owner, amount: 1, type: PAYMENT_TYPES.WRITE_OFF, host,
        });
      }

      beforeDelete = await reports.getReport({ userName: owner });
      beforeDeleteHost = await reports.getReport({ userName: owner, host });

      await App.deleteOne({ _id: app._id });
      await AppFactory.Create({ owner: newOwner, host });
      await WebsitePaymentsFactory.Create({ name: newOwner, amount });
      for (let i = 0; i < amount - 1; i++) {
        await WebsitePaymentsFactory.Create({
          name: newOwner, amount: 1, type: PAYMENT_TYPES.WRITE_OFF, host,
        });
      }

      afterDelete = await reports.getReport({ userName: owner });
      afterDeleteHost = await reports.getReport({ userName: owner, host });
    });
    it('should results be the same with call without host', async () => {
      expect(beforeDelete).to.be.deep.eq(afterDelete);
    });

    it('should results be the same with call with host', async () => {
      expect(beforeDeleteHost).to.be.deep.eq(afterDeleteHost);
    });
  });
});
