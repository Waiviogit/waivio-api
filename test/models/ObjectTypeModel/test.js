const {
  ObjectTypeModel, faker, expect, dropDatabase,
} = require('test/testHelper');
const _ = require('lodash');
const { ObjectTypeFactory, ObjectFactory } = require('test/factories');

describe('ObjectTypeModel', async () => {
  describe('On getAll', async () => {
    let objCount;
    beforeEach(async () => {
      await dropDatabase();
      objCount = _.random(4, 10);
    });
    describe('Should return correct data', async () => {
      beforeEach(async () => {
        for (let iter = 0; iter < objCount; iter++) {
          await ObjectTypeFactory.Create();
        }
      });
      it('Should return an array', async () => {
        const { objectTypes } = await ObjectTypeModel.getAll({
          limit: objCount,
          skip: 0,
        });
        expect(objectTypes).to.be.an('array');
      });
      it('Should return all types', async () => {
        const { objectTypes } = await ObjectTypeModel.getAll({
          limit: objCount,
          skip: 0,
        });
        expect(objectTypes.length).to.be.eq(objCount);
      });
    });
    it('Should check that the related_wobjects array is not empty', async () => {
      const similarData = faker.random.word();
      const wobjectsCount = _.random(1, 3);
      await ObjectTypeFactory.Create({ name: similarData });
      for (let iter = 0; iter < objCount; iter++) {
        await ObjectFactory.Create({ objectType: similarData });
      }
      const { objectTypes } = await ObjectTypeModel.getAll({
        limit: objCount,
        skip: 0,
        wobjects_count: wobjectsCount,
      });
      expect(objectTypes[0].related_wobjects).to.have.length(wobjectsCount);
    });
    it('Should check that the error exist', async () => {
      const { error } = await ObjectTypeModel.getAll({
        limit: objCount,
        skip: 0,
        wobjects_count: faker.random.string(),
      });
      expect(error).to.be.exist;
    });
  });
  describe('On search', async () => {
    let objCount, supportedTypes, string;
    beforeEach(async () => {
      await dropDatabase();
      string = faker.random.word();
      objCount = _.random(4, 10);
      supportedTypes = [string, faker.random.word()];
      for (let iter = 0; iter < objCount; iter++) {
        await ObjectTypeFactory.Create({
          name: string,
        });
      }
    });
    it('Should return an array', async () => {
      const { objectTypes } = await ObjectTypeModel.search({
        string,
        supportedTypes: [faker.random.word()],
      });
      expect(objectTypes).to.be.an('array');
    });
    it('Should search by the supportedTypes', async () => {
      const { objectTypes } = await ObjectTypeModel.search({
        string,
        supportedTypes,
      });
      expect(objectTypes).to.have.length(1);
    });
    it('Should check that the error exist', async () => {
      const { error } = await ObjectTypeModel.search({
        string,
        limit: faker.lorem.word(),
      });
      expect(error).to.be.exist;
    });
    it('Should return error if string is empty', async () => {
      const { error } = await ObjectTypeModel.search({ limit: 20, skip: 0 });
      expect(error.status).to.be.eq(422);
    });
  });
  describe('On getOne', async () => {
    let name;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.lorem.word();
      await ObjectTypeFactory.Create({ name });
    });
    it('Should return correct Object Type', async () => {
      const { objectType } = await ObjectTypeModel.getOne({ name });
      expect(objectType.name).to.be.eq(name);
    });
    it('Should return an error.status 404', async () => {
      const { error } = await ObjectTypeModel.getOne(faker.name.firstName());
      expect(error.status).to.be.eq(404);
    });
    it('Should return an error', async () => {
      const { error } = await ObjectTypeModel.getOne({ type: 'type' });
      expect(error).to.be.exist;
    });
  });
  describe('On aggregate', () => {
    let objCount;
    let skip;
    beforeEach(async () => {
      await dropDatabase();
      skip = _.random(1, 3);
      objCount = _.random(4, 10);
      for (let iter = 0; iter < objCount; iter++) {
        await ObjectTypeFactory.Create({ name: `asdf_${faker.random.string()}` });
      }
    });
    it('Should return a correct array', async () => {
      const { result } = await ObjectTypeModel.aggregate([
        { $match: { name: new RegExp('^asdf_') } },
        { $skip: skip },
      ]);
      expect(result).to.have.length(objCount - skip);
    });
    it('Should check that the error exist', async () => {
      const { error } = await ObjectTypeModel.aggregate('test');
      expect(error).to.be.exist;
    });
  });
});
