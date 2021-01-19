const {
  faker, expect, dropDatabase, _, App,
} = require('test/testHelper');
const { PAYMENT_TYPES } = require('constants/sitesConstants');
const { AppFactory, WebsitePaymentsFactory } = require('test/factories');
const manage = require('utilities/operations/sites/manage');

describe('On manage.js', async () => {
  describe('On getManagePage when owner delete his site', async () => {
    let beforeDelete, afterDelete, amount;
    beforeEach(async () => {
      await dropDatabase();
      const owner = faker.random.string();
      const newOwner = faker.random.string();
      const app = await AppFactory.Create({ owner });
      const { host } = app;
      amount = _.random(5, 10);
      await WebsitePaymentsFactory.Create({ name: owner, amount });
      for (let i = 0; i < amount - 1; i++) {
        await WebsitePaymentsFactory.Create({
          name: owner, amount: 1, type: PAYMENT_TYPES.WRITE_OFF, host,
        });
      }

      beforeDelete = await manage.getManagePage({ userName: owner });

      await App.deleteOne({ _id: app._id });
      await AppFactory.Create({ owner: newOwner, host });
      await WebsitePaymentsFactory.Create({ name: newOwner, amount });
      for (let i = 0; i < amount - 1; i++) {
        await WebsitePaymentsFactory.Create({
          name: newOwner, amount: 1, type: PAYMENT_TYPES.WRITE_OFF, host,
        });
      }

      afterDelete = await manage.getManagePage({ userName: owner });
    });
    it('should paid be the same before delete and after delete', async () => {
      expect(beforeDelete.paid).to.be.eq(afterDelete.paid);
    });
  });
});
