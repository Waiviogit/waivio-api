const {
  expect, UserWobjectsModel, faker, dropDatabase,
} = require('test/testHelper');
const { UserWobjectsFactory } = require('test/factories');
const _ = require('lodash');

describe('UserWobjects', async () => {
  let userName, link, countUserWobjects;
  beforeEach(async () => {
    await dropDatabase();
    countUserWobjects = _.random(20, 30);
    userName = faker.name.firstName();
    link = faker.random.string();
    await UserWobjectsFactory.Create({
      userName,
      authorPermlink: link,
    });
  });
  describe('On find', async () => {
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
    it('Shoud check that userWobject has keys _id and author_permlink', async () => {
      await UserWobjectsFactory.Create({ userName, authorPermlink: faker.random.string() });
      const { result } = await UserWobjectsModel.findOne(
        { user_name: userName },
        { author_permlink: 1 },
      );
      expect(result).to.have.keys('_id', 'author_permlink');
    });
    it('Shoud check that userWobject does not have key author_permlink', async () => {
      await UserWobjectsFactory.Create({ userName, authorPermlink: faker.random.string() });
      const { result } = await UserWobjectsModel.findOne(
        { user_name: userName },
        { author_permlink: 0 },
      );
      expect(result).to.not.have.keys('author_permlink');
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
  describe('On aggregate', async () => {
    let pipeline, limit;
    beforeEach(async () => {
      await dropDatabase();
      limit = _.random(5, 10);
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
