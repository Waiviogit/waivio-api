const {
  expect, WebsitePaymentsModel, faker, dropDatabase,
} = require('test/testHelper');
const { WebsitePaymentsFactory } = require('test/factories');
const _ = require('lodash');
const { PAYMENT_TYPES } = require('../../../constants/sitesConstants');

describe('WebsitePaymentsModel', () => {
  describe('On find', () => {
    const host = faker.random.string();
    const counter = _.random(3, 10);
    beforeEach(async () => {
      await dropDatabase();
      for (let i = 0; i < counter; i++) {
        await WebsitePaymentsFactory.Create({
          host,
          type: PAYMENT_TYPES.WRITE_OFF,
          amount: _.random(1, 20),
        });
      }
      for (let i = 0; i < _.random(1, 3); i++) {
        await WebsitePaymentsFactory.Create({
          type: PAYMENT_TYPES.WRITE_OFF,
          amount: _.random(1, 20),
        });
      }
    });
    it('Should return array "counter" elements long', async () => {
      const { result } = await WebsitePaymentsModel.find(
        { condition: { host }, sort: { amount: 1 } },
      );
      expect(result).to.have.length(counter);
    });
    it('Should return return an array where "host" is equal to the specified value', async () => {
      const { result } = await WebsitePaymentsModel.find(
        { condition: { host }, sort: { amount: 1 } },
      );
      result.forEach((element) => expect(element.host).to.be.eq(host));
    });
    it('Should return a sorted array of elements where "amount" of the first element is less than "amount" of the last element', async () => {
      const { result } = await WebsitePaymentsModel.find(
        { condition: { host }, sort: { amount: 1 } },
      );
      expect(result[0].amount).to.be.lessThan(result[result.length - 1].amount);
    });
    it('Should return a sorted array of elements where "amount" of the first element is greater than "amount" of the last element', async () => {
      const { result } = await WebsitePaymentsModel.find(
        { condition: { host }, sort: { amount: -1 } },
      );
      expect(result[0].amount).to.be.greaterThan(result[result.length - 1].amount);
    });
    it('Should check that the error exist', async () => {
      const { error } = await WebsitePaymentsModel.find({ condition: host, sort: { amount: 1 } });
      expect(error).to.be.exist;
    });
  });

  describe('On aggregate', () => {
    const name = faker.name.firstName();
    const counter = _.random(3, 10);
    beforeEach(async () => {
      await dropDatabase();
      for (let i = 0; i < counter; i++) {
        await WebsitePaymentsFactory.Create({
          name,
        });
      }
      for (let i = 0; i < _.random(1, 3); i++) {
        await WebsitePaymentsFactory.Create({});
      }
    });
    it('Should return an array of length equal "counter" in which the specified condition is met', async () => {
      const { result } = await WebsitePaymentsModel.aggregate([{ $match: { userName: name } }]);
      expect(result).to.have.length(counter);
    });
    it('Should return an array where the name is equal to the given condition', async () => {
      const { result } = await WebsitePaymentsModel.aggregate([{ $match: { userName: name } }]);
      result.forEach((element) => expect(element.userName).to.be.eq(name));
    });
    it('Should check that the error exist', async () => {
      const { error } = await WebsitePaymentsModel.aggregate({ $match: { userName: name } });
      expect(error).to.be.exist;
    });
  });

  describe('On findOne', () => {
    const name = faker.name.firstName();
    const counter = _.random(3, 10);
    beforeEach(async () => {
      await dropDatabase();
      for (let i = 0; i < counter; i++) {
        await WebsitePaymentsFactory.Create({
          name,
        });
      }
      for (let i = 0; i < _.random(1, 3); i++) {
        await WebsitePaymentsFactory.Create({});
      }
    });
    it('Should return one element that satisfies the condition', async () => {
      const { result } = await WebsitePaymentsModel.findOne({ userName: name });
      expect(result.userName).to.be.eq(name);
    });
    it('Should check that the error exist', async () => {
      const { error } = await WebsitePaymentsModel.findOne(faker.random.string());
      expect(error).to.be.exist;
    });
  });

  describe('On distinct', () => {
    const name1 = faker.name.firstName();
    const name2 = faker.name.firstName();
    const amount = _.random(10, 25);
    const counter = _.random(3, 10);
    beforeEach(async () => {
      await dropDatabase();
      for (let i = 0; i < counter; i++) {
        await WebsitePaymentsFactory.Create({
          name: _.sample([name1, name2]),
          amount,
        });
      }
      for (let i = 0; i < _.random(1, 3); i++) {
        await WebsitePaymentsFactory.Create({
          amount: _.random(1, 20),
        });
      }
    });
    it('Should return an array of two unique elements', async () => {
      const { result } = await WebsitePaymentsModel.distinct({ field: 'userName', query: { amount } });
      expect(result).to.have.members([name1, name2]);
    });
    it('Should return an array length of which must be equal to the number of unique elements', async () => {
      const { result } = await WebsitePaymentsModel.distinct({ field: 'userName', query: { amount } });
      expect(result).to.have.length(2);
    });
    it('Should check that the error exist', async () => {
      const { error } = await WebsitePaymentsModel.distinct(faker.random.string());
      expect(error).to.be.exist;
    });
  });
});
