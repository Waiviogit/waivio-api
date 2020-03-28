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
    it('Should check names for identity', async () => {
      result = await AppModel.getOne({ name: app.name });
      expect(result.app).to.deep.eq(app._doc);
    });
    it('Should check that the error exists', async () => {
      result = await AppModel.getOne({ name: faker.random.string() });
      expect(result.error).is.exist;
    });
    it('Should return error message', async () => {
      result = await AppModel.getOne({ name: faker.random.string() });
      expect(result.error.message).to.eq('App not found!');
    });
  });
  describe('On getAll', async () => {
    let iteration, result;
    beforeEach(async () => {
      await dropDatabase();
      for (iteration = 0; iteration < 5; iteration++) {
        await AppFactory.Create();
      }
    });
    it('Should check number of entries', async () => {
      result = await AppModel.getAll();
      expect(result.apps.length).to.eq(iteration);
    });
    it('Should check that the error exists', async () => {
      await dropDatabase();
      result = await AppModel.getAll();
      expect(result.error).is.exist;
    });
    it('Should return error message', async () => {
      await dropDatabase();
      result = await AppModel.getAll();
      expect(result.error.message).to.eq('App not found!');
    });
  });
  describe('On aggregate', async () => {
    let name, admins, blacklists, supportedHashtags, supportedObjects, app, aggResult, result;
    beforeEach(async () => {
      name = faker.name.firstName();
      admins = [faker.name.firstName().toLowerCase()];
      blacklists = [faker.name.firstName().toLowerCase()];
      supportedHashtags = [faker.random.string(5)];
      supportedObjects = [faker.random.string(5)];
      app = await AppFactory.Create({
        name, admins, blacklists, supportedHashtags, supportedObjects,
      });
    });
    it('Should return from our request: name and admins', async () => {
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
    it('Should return from our request: name and blacklist users', async () => {
      aggResult = await AppModel.aggregate([
        { $match: { name: app.name } },
        {
          $project: {
            _id: 0, name: 1, blacklists: 1,
          },
        },
      ]);
      [result] = aggResult.result;
      expect(result).to.deep.eq(_.pick(app, ['name', 'blacklists']));
    });
    it('Should return from our request: name, blacklist users, supported Hashtags, supported Objects', async () => {
      aggResult = await AppModel.aggregate([
        { $match: { name: app.name } },
        {
          $project: {
            _id: 0, name: 1, blacklists: 1, supported_hashtags: 1, supported_objects: 1,
          },
        },
      ]);
      [result] = aggResult.result;
      expect(result).to.deep.eq(_.pick(app, ['name', 'blacklists', 'supported_hashtags', 'supported_objects']));
    });
    it('There is no blacklist as a result of our request', async () => {
      aggResult = await AppModel.aggregate([
        { $match: { name: app.name } },
        {
          $project: {
            _id: 0, name: 1, admins: 1,
          },
        },
      ]);
      [result] = aggResult.result;
      expect(result).to.not.have.property('blacklists');
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
    let name, app1, app, result;
    beforeEach(async () => {
      name = faker.name.firstName();
      app1 = await AppFactory.Create({ name });
    });
    it('Update name at our request and get true', async () => {
      result = await AppModel.updateOne({ name, updData: { $set: { name: faker.name.firstName() } } });
      expect(result.result).to.be.true;
    });
    it('Should return false, when the data has not updated', async () => {
      result = await AppModel.updateOne({ name: 'null', updData: { $set: { name: faker.name.firstName() } } });
      expect(result.result).to.be.false;
    });
    it('Should return duplicate key error, when the data has duplicate name', async () => {
      app = await AppFactory.Create({ name: faker.name.firstName() });
      result = await AppModel.updateOne({ name: app1.name, updData: { $set: { name: app.name } } });
      expect(result.error).is.exist;
    });
  });
});
