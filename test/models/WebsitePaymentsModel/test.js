const {
  expect, WebsitePaymentsModel, faker, dropDatabase,
} = require('test/testHelper');
const { WebsitePaymentsFactory } = require('test/factories');
const { PAYMENT_TYPES } = require('../../../constants/sitesConstants');

describe('WebsitePaymentsModel', () => {
  describe('On find', () => {
    let host, condition, sort, websitePayments;
    beforeEach(async () => {
      await dropDatabase();
      host = faker.random.string();
      condition = { host };
      sort = { createAt: 1 };

      const websitePayment1 = {
        host,
        type: PAYMENT_TYPES.WRITE_OFF,
        amount: 10,
      };
      const websitePayment2 = {
        host,
        type: PAYMENT_TYPES.REFUND,
        amount: 15,
      };
      const websitePayment3 = {
        host,
        type: PAYMENT_TYPES.WRITE_OFF,
        amount: 20,
      };
      const websitePayment4 = {
        type: PAYMENT_TYPES.REFUND,
        amount: 13,
      };
      websitePayments = [websitePayment1, websitePayment2, websitePayment3, websitePayment4];
      for (const websitePayment of websitePayments) {
        await WebsitePaymentsFactory.Create({ ...websitePayment });
      }
    });

    it('Should return array 3 elements long', async () => {
      const { result } = await WebsitePaymentsModel.find({ condition, sort });
      expect(result).to.have.length(3);
    });
    it('Should return array without one element and when searching not to find it', async () => {
      const { result } = await WebsitePaymentsModel.find({ condition, sort });
      expect(result).to.not.include(websitePayments[3]);
    });
    it('Should return array whose first element will contain the smallest amount & the last largest', async () => {
      const { result } = await WebsitePaymentsModel.find({ condition, sort });
      expect(result[0].amount).to.be.eq(websitePayments[0].amount);
      expect(result[2].amount).to.be.eq(websitePayments[2].amount);
    });
    it('Should check that the result will be undefined', async () => {
      const { error } = await WebsitePaymentsModel.find(faker.random.string());
      expect(error).to.be.undefined;
    });
  });

  describe('On aggregate', () => {
    let websitePayments, condition, name;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      condition = [{ $match: { userName: name } }];
      const websitePayment1 = { name };
      const websitePayment2 = { name };
      const websitePayment3 = { name: faker.name.firstName() };
      const websitePayment4 = { name: faker.name.firstName() };
      websitePayments = [websitePayment1, websitePayment2, websitePayment3, websitePayment4];
      for (const websitePayment of websitePayments) {
        await WebsitePaymentsFactory.Create({ ...websitePayment });
      }
    });
    it('Should return an array in which the names match the condition', async () => {
      const { result } = await WebsitePaymentsModel.aggregate(condition);
      expect(result).to.have.length(2);
    });
    it('Should return an array that does not contain elements that satisfy the condition', async () => {
      const { result } = await WebsitePaymentsModel.aggregate(condition);
      expect(result).to.not.include(websitePayments[2]);
      expect(result).to.not.include(websitePayments[3]);
    });
  });

  describe('On findOne', () => {
    let websitePayments, condition, name;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      condition = { userName: name };
      const websitePayment1 = { name };
      const websitePayment2 = { name: faker.name.firstName() };
      const websitePayment3 = { name: faker.name.firstName() };
      const websitePayment4 = { name: faker.name.firstName() };
      websitePayments = [websitePayment1, websitePayment2, websitePayment3, websitePayment4];
      for (const websitePayment of websitePayments) {
        await WebsitePaymentsFactory.Create({ ...websitePayment });
      }
    });
    it('Should return one element that satisfies the condition', async () => {
      const { result } = await WebsitePaymentsModel.findOne(condition);
      expect(result.userName).to.be.eq(websitePayments[0].name);
    });
    it('Should check that the error exist', async () => {
      const { error } = await WebsitePaymentsModel.findOne(faker.random.string());
      expect(error).to.be.exist;
    });
  });

  describe('On distinct', () => {
    let websitePayments, name1, name2, field, query;
    beforeEach(async () => {
      await dropDatabase();
      field = 'userName';
      query = { amount: 15 };
      name1 = faker.name.firstName();
      name2 = faker.name.firstName();
      const websitePayment1 = { name: name1, amount: 15 };
      const websitePayment2 = { name: name1, amount: 12 };
      const websitePayment3 = { name: name2, amount: 15 };
      const websitePayment4 = { amount: 13 };
      websitePayments = [websitePayment1, websitePayment2, websitePayment3, websitePayment4];
      for (const websitePayment of websitePayments) {
        await WebsitePaymentsFactory.Create({ ...websitePayment });
      }
    });
    it('Should return an array of two unique elements', async () => {
      const { result } = await WebsitePaymentsModel.distinct({ field, query });
      expect(result).to.have.members([websitePayments[2].name, websitePayments[0].name]);
    });
    it('Should return an array of only unique elements', async () => {
      const { result } = await WebsitePaymentsModel.distinct({ field, query });
      expect(result).to.have.length(2);
    });
    it('Should check that the error exist', async () => {
      const { error } = await WebsitePaymentsModel.distinct(faker.random.string());
      expect(error).to.be.exist;
    });
  });
});
