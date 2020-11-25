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
        expect(Array.isArray(objectTypes)).to.be.true;
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
      expect(objectTypes[0].related_wobjects.length).to.be.eq(wobjectsCount);
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
    let objCount;
    beforeEach(async () => {
      await dropDatabase();
      objCount = _.random(4, 10);
      for (let iter = 0; iter < objCount; iter++) {
        await ObjectTypeFactory.Create({
          name: 'asdf',
        });
      }
    });
    it('Should return an array', async () => {
      const { objectTypes } = await ObjectTypeModel.search({
        string: 'asdf',
        supportedTypes: ['test_type'],
      });
      expect(Array.isArray(objectTypes)).to.be.true;
    });
    it('Should check that the error exist', async () => {
      const { error } = await ObjectTypeModel.search({
        string: 'asdf',
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
        await ObjectTypeFactory.Create({ name: `asdf_${faker.lorem.word()}` });
      }
    });
    it('Should return a correct array', async () => {
      const { result } = await ObjectTypeModel.aggregate([
        { $skip: skip },
        { $match: { name: new RegExp('^asdf_') } },
      ]);
      expect(result.length).to.be.eq(objCount - skip);
    });
    it('Should return an error.status 404', async () => {
      const { error } = await ObjectTypeModel.aggregate([
        { $skip: skip },
        { $match: { name: faker.name.firstName() } },
      ]);
      expect(error.status).to.be.eq(404);
    });
    it('Should check that the error exist', async () => {
      const { error } = await ObjectTypeModel.aggregate('test');
      expect(error).to.be.exist;
    });
  });
});
