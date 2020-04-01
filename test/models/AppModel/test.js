const {
  expect, AppModel, faker, dropDatabase,
} = require('test/testHelper');
const { AppFactory } = require('test/factories');
const _ = require('lodash');

describe('App Model', async () => {
  describe('On getOne', async () => {
    let app;
    beforeEach(async () => {
      app = await AppFactory.Create();
    });
    it('Should check app for identity', async () => {
      const { app: myApp } = await AppModel.getOne({ name: app.name, bots: 0 });
      expect(myApp).to.deep.eq(_.omit(app._doc, 'service_bots'));
    });
    it('Should check that the error exists', async () => {
      const { error } = await AppModel.getOne({ name: faker.random.string() });
      expect(error).to.be.exist;
    });
    it('Should return error message', async () => {
      const { error } = await AppModel.getOne({ name: faker.random.string() });
      expect(error.message).to.be.eq('App not found!');
    });
  });
  describe('On getAll', async () => {
    let appsCount;
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
        const { apps } = await AppModel.getAll();
        expect(apps.length).to.be.eq(appsCount);
      });
    });
    describe('On error case', async () => {
      let result;
      beforeEach(async () => {
        result = await AppModel.getAll();
      });
      it('Should check that the error exists', async () => {
        expect(result.error).to.be.exist;
      });
      it('Should return error message', async () => {
        expect(result.error.message).to.be.eq('App not found!');
      });
    });
  });
  describe('On aggregate', async () => {
    let name, admins, blacklists, app, appsCount;
    beforeEach(async () => {
      await dropDatabase();
      appsCount = 5;
      name = faker.name.firstName();
      admins = [faker.name.firstName().toLowerCase()];
      blacklists = [faker.name.firstName().toLowerCase()];
      for (let iteration = 0; iteration < appsCount; iteration++) {
        if (iteration === 0) {
          app = await AppFactory.Create({
            name, admins, blacklists,
          });
        } else await AppFactory.Create();
      }
    });
    describe('On group stage case', async () => {
      let aggregatedApps;
      beforeEach(async () => {
        aggregatedApps = await AppModel.aggregate([
          {
            $group: {
              _id: '$_id',
              name: { $first: '$name' },
              admins: { $first: '$admins' },
            },
          },
        ]);
      });
      it('Should return right count records', async () => {
        expect(aggregatedApps.result.length).to.be.eq(appsCount);
      });
      it('Should return records with id, name and admins keys', async () => {
        expect(aggregatedApps.result[0]).to.have.all.keys('_id', 'name', 'admins');
      });
    });
    it('Should return from request: name and admins. Using match and project stage', async () => {
      const { result: [result] } = await AppModel.aggregate([
        { $match: { name: app.name } },
        {
          $project: {
            _id: 0, name: 1, admins: 1,
          },
        },
      ]);
      expect(result).to.deep.eq(_.pick(app, ['name', 'admins']));
    });
    it('Should return from request: whole app. Using match stage', async () => {
      const { result: [result] } = await AppModel.aggregate([
        { $match: { name: app.name } },
      ]);
      expect(result).to.deep.eq(app._doc);
    });
    it('Should return undefined, when aggregate has not result', async () => {
      const { result: [result] } = await AppModel.aggregate([
        { $match: { name: faker.random.string(20) } },
        {
          $project: {
            _id: 0, name: 1, admins: 1,
          },
        },
      ]);
      expect(result).to.be.undefined;
    });
  });
  describe('On updateOne', async () => {
    let name, app;
    beforeEach(async () => {
      name = faker.name.firstName();
      app = await AppFactory.Create({ name });
    });
    it('Should update name at request and get true', async () => {
      const { result } = await AppModel.updateOne(
        { name, updData: { $set: { name: faker.name.firstName() } } },
      );
      expect(result).to.be.true;
    });
    it('Should return false, when the data has not updated', async () => {
      const { result } = await AppModel.updateOne(
        { name: faker.name.firstName(), updData: { $set: { name: faker.name.firstName() } } },
      );
      expect(result).to.be.false;
    });
    it('Should return duplicate key error, when the data has duplicate name', async () => {
      const appDuplicate = await AppFactory.Create({ name: faker.name.firstName() });
      const { error } = await AppModel.updateOne(
        { name: app.name, updData: { $set: { name: appDuplicate.name } } },
      );
      expect(error).to.be.exist;
    });
  });
});
