const {
  expect, AppModel, faker, dropDatabase,
} = require('test/testHelper');
const { AppFactory } = require('test/factories/');
const _ = require('lodash');

describe('App Model', async () => {
  describe('On getOne', async () => {
    let app, result;
    beforeEach(async () => {
      app = await AppFactory.Create();
    });
    it('Should check app for identity', async () => {
      result = await AppModel.getOne({ name: app.name, bots: 0 });
      expect(result.app).to.deep.eq(_.omit(app._doc, 'service_bots'));
    });
    it('Should check that the error exists', async () => {
      result = await AppModel.getOne({ name: faker.random.string() });
      expect(result.error).to.be.exist;
    });
    it('Should return error message', async () => {
      result = await AppModel.getOne({ name: faker.random.string() });
      expect(result.error.message).to.be.eq('App not found!');
    });
  });
  describe('On getAll', async () => {
    let result, appsCount;
    beforeEach(async () => {
      await dropDatabase();
    });
    describe('On success case', async () => {
      beforeEach(async () => {
        appsCount = 5;
        for (let iteration = 0; iteration < appsCount; iteration++) {
          await AppFactory.Create();
        }
      });
      it('Should check that getAll returns correct number of records', async () => {
        result = await AppModel.getAll();
        expect(result.apps.length).to.be.eq(appsCount);
      });
    });
    describe('On error case', async () => {
      beforeEach(async () => {
        result = await AppModel.getAll();
      });
      it('Should check that the error exists', async () => {
        expect(result.error).is.exist;
      });
      it('Should return error message', async () => {
        expect(result.error.message).to.be.eq('App not found!');
      });
    });
  });
  describe('On aggregate', async () => {
    let name, admins, blacklists, app, aggResult, result;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      admins = [faker.name.firstName().toLowerCase()];
      blacklists = [faker.name.firstName().toLowerCase()];
      app = await AppFactory.Create({
        name, admins, blacklists,
      });
    });
    it('Should return from our request: id, name and admins. Using group stage', async () => {
      aggResult = await AppModel.aggregate([
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            admins: { $first: '$admins' },
          },
        },
      ]);
      [result] = aggResult.result;
      expect(result).to.deep.eq(_.pick(app, ['_id', 'name', 'admins']));
    });
    it('Should return from our request: name and admins. Using match and project stage', async () => {
      aggResult = await AppModel.aggregate([
        { $match: { name: app.name } },
        {
          $project: {
            _id: 0, name: 1, admins: 1,
          },
        },
      ]);
      [result] = aggResult.result;
      expect(result).to.deep.eq(_.pick(app, ['name', 'admins']));
    });
    it('Should return from our request: whole app. Using match stage', async () => {
      aggResult = await AppModel.aggregate([
        { $match: { name: app.name } },
      ]);
      [result] = aggResult.result;
      expect(result).to.deep.eq(app._doc);
    });
    it('Should return undefined, when aggregate has not result', async () => {
      aggResult = await AppModel.aggregate([
        { $match: { surname: app.name } },
        {
          $project: {
            _id: 0, name: 1, admins: 1,
          },
        },
      ]);
      [result] = aggResult.result;
      expect(result).to.be.undefined;
    });
  });
  describe('On updateOne', async () => {
    let name, app, result;
    beforeEach(async () => {
      name = faker.name.firstName();
      app = await AppFactory.Create({ name });
    });
    it('Should update name at request and get true', async () => {
      result = await AppModel.updateOne({ name, updData: { $set: { name: faker.name.firstName() } } });
      expect(result.result).to.be.true;
    });
    it('Should return false, when the data has not updated', async () => {
      result = await AppModel.updateOne({ name: 'null', updData: { $set: { name: faker.name.firstName() } } });
      expect(result.result).to.be.false;
    });
    it('Should return duplicate key error, when the data has duplicate name', async () => {
      const appDuplicate = await AppFactory.Create({ name: faker.name.firstName() });
      result = await AppModel.updateOne({ name: app.name, updData: { $set: { name: appDuplicate.name } } });
      expect(result.error).to.be.exist;
    });
  });
});
