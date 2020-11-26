const {
  expect, UserWobjectsModel, faker, dropDatabase,
} = require('test/testHelper');
const { UserWobjectsFactory } = require('test/factories');
const _ = require('lodash');

describe('UserWobjects', async () => {
  let userName, link, countUserWobjects;
  beforeEach(async () => {
    await dropDatabase();
    countUserWobjects = _.random(10, 30);
    userName = faker.name.firstName();
    link = faker.random.string();
    await UserWobjectsFactory.Create({
      userName,
      authorPermlink: link,
    });
  });
  describe('On aggregate', async () => {
    let usersWobjCount;
    beforeEach(async () => {
      await dropDatabase();
      usersWobjCount = _.random(5, 10);
      userName = faker.name.firstName();
      for (let iter = 0; iter < usersWobjCount; iter++) {
        link = faker.internet.url();
        await UserWobjectsFactory.Create({
          userName,
          authorPermlink: link,
        });
      }
    });
    it('Should return correct number of userWobjects', async () => {
      await UserWobjectsFactory.Create({
        userName: faker.name.firstName(),
        authorPermlink: link,
      });
      const { result } = await UserWobjectsModel.find({
        user_name: userName,
      });
      expect(result).to.have.length(usersWobjCount);
    });
    it('Should check that the error exist', async () => {
      const { error } = await UserWobjectsModel.find(
        faker.random.string(),
        usersWobjCount,
      );
      expect(error).to.be.exist;
    });
  });
  describe('On findOne', async () => {
    it('Should return correct userWobject', async () => {
      const { result } = await UserWobjectsModel.findOne({ author_permlink: link });
      expect(result.author_permlink).to.be.eq(link);
    });
    it('Shoud return correct userWobject if select was defined', async () => {
      await UserWobjectsFactory.Create({ userName, authorPermlink: faker.random.string() });
      const { result } = await UserWobjectsModel.findOne({ user_name: userName },
        { author_permlink: link });
      expect(result.author_permlink).to.be.eq(link);
    });
    it('Should check that the error exist', async () => {
      const { error } = await UserWobjectsModel.findOne(faker.random.string());
      expect(error).to.be.exist;
    });
  });
  describe('On countDocuments', async () => {
    beforeEach(async () => {
      for (let iter = 0; iter < countUserWobjects; iter++) {
        await UserWobjectsFactory.Create({
          userName: faker.name.firstName,
          authorPermlink: faker.internet.url(),
        });
      }
    });
    it('Should return correct number of userWobjects', async () => {
      const correctCount = _.random(1, 10);
      userName = faker.name.firstName();
      for (let iter = 0; iter < correctCount; iter++) {
        await UserWobjectsFactory.Create({
          userName,
          authorPermlink: faker.internet.url(),
        });
      }
      const { count } = await UserWobjectsModel.countDocuments({ user_name: userName });
      expect(count).to.be.eq(correctCount);
    });
  });
  describe('On getByWobject', async () => {
    let correctUserWobj;
    beforeEach(async () => {
      await dropDatabase();
      for (let iter = 0; iter < countUserWobjects; iter++) {
        await UserWobjectsFactory.Create({
          username: userName,
          authorPermlink: faker.internet.url(),
        });
      }
      correctUserWobj = await UserWobjectsFactory.Create({
        username: userName,
        authorPermlink: link,
        weight: 1,
      });
    });
    it('Should return correct wobject', async () => {
      const { experts } = await UserWobjectsModel.getByWobject({
        authorPermlink: link,
      });
      expect(experts[0].name).to.be.eq(correctUserWobj.user_name);
    });
    it('Should return correct user if he has the weight field', async () => {
      const { experts } = await UserWobjectsModel.getByWobject({
        authorPermlink: link,
        weight: 1,
      });
      expect(experts[0].name).to.be.eq(correctUserWobj.user_name);
    });
  });
  describe('On getByWobject: Returns a single correct wobject', async () => {
    let singleUser;
    beforeEach(async () => {
      await dropDatabase();
      singleUser = await UserWobjectsFactory.Create({
        userName,
        authorPermlink: link,
      });
    });
    it('Should return a single user if the name and the authorPermlink was transmitted',
      async () => {
        const { experts } = await UserWobjectsModel.getByWobject({
          authorPermlink: link,
          username: userName,
        });
        expect(experts).to.have.length(1);
      });
    it('Should return a correct user if the name and the authorPermlink was transmitted',
      async () => {
        const { experts } = await UserWobjectsModel.getByWobject({
          authorPermlink: link,
          username: userName,
        });
        expect(experts[0].username).to.be.eq(singleUser.username);
      });
  });
  describe('On aggregate', async () => {
    let pipeline, limit;
    beforeEach(async () => {
      await dropDatabase();
      limit = _.random(10, 20);
      pipeline = [{ $match: { user_name: userName } },
        { $sort: { weight: -1 } },
        { $skip: 0 },
        { $limit: limit },
      ];
      for (let iter = 0; iter < countUserWobjects; iter++) {
        await UserWobjectsFactory.Create({
          userName,
        });
      }
    });
    it('Should return correct number of wobjects', async () => {
      const { result } = await UserWobjectsModel.aggregate(pipeline);
      expect(result).to.have.length(limit);
    });
    it('Should check that the error exist', async () => {
      const { error } = await UserWobjectsModel.aggregate({});
      expect(error).to.be.exist;
    });
  });
});
