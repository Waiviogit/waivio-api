const {
  expect, UserModel, faker, dropDatabase,
} = require('test/testHelper');
const _ = require('lodash');
const { UsersFactory } = require('test/factories');

describe('UserModel', () => {
  describe('On getOne', () => {
    let user;
    beforeEach(async () => {
      user = await UsersFactory.Create();
    });
    it('Should return an object', async () => {
      const myUser = await UserModel.getOne({ name: user.name, keys: 'wobjects_weight' });
      expect(myUser).to.be.an('Object');
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.getOne({ host: faker.random.string() });
      expect(error).to.be.exist;
    });
    it('Should return null when user can\'t be found', async () => {
      const { user: myUser } = await UserModel.getOne();
      expect(myUser).to.be.null;
    });
  });
  describe('On findOneByCondition', async () => {
    let name;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      await UsersFactory.Create({ name });
    });
    it('Should return right user', async () => {
      await UsersFactory.Create();
      const { user } = await UserModel.findOneByCondition({ name });
      expect(user.name).to.be.eq(name);
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.findOneByCondition([]);
      expect(error).to.be.exist;
    });
  });
  describe('On getAll', async () => {
    let usersCount;
    beforeEach(async () => {
      // await dropDatabase();
    });
    it('Should returns correct number of records', async () => {
      usersCount = _.random(1, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create();
      }
      const { UserData } = await UserModel.getAll({ skip: 0, limit: usersCount });
      expect(UserData.length).to.be.eq(usersCount);
    });
    it('Should check that the error exists', async () => {
      await UsersFactory.Create();
      const { error } = await UserModel.getAll({ limit: faker.lorem.word() });
      expect(error).to.be.exist;
    });
  });
  describe('On getObjectsFollow', async () => {
    let name;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      await UsersFactory.Create({ name });
    });
    it('Should return an array', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({ name });
      expect(Array.isArray(wobjects)).to.be.true;
    });
    it('Should return empty array if username was not transmitted', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({ limit: 10, skip: 0 });
      expect(wobjects).to.be.empty;
    });
    it('Should return an error if arguments is null', async () => {
      const { error } = await UserModel.getObjectsFollow(null);
      expect(error).to.be.exist;
    });
  });
  describe('On aggregate', async () => {
    let usersCount;
    beforeEach(async () => {
      await dropDatabase();
      usersCount = _.random(1, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create({ name: `asdf_${faker.lorem.word()}` });
      }
    });
    it('Should return array with correct users.length', async () => {
      await UsersFactory.Create();
      const { result } = await UserModel.aggregate([
        {
          $match: {
            name: new RegExp('^asdf_'),
          },
        }]);
      expect(Array.isArray(result)).to.be.true;
      expect(result.length).to.be.eq(usersCount);
    });
    it('Should return an error if pipeline is not correct', async () => {
      const { error } = await UserModel.aggregate({ name: 10 });
      expect(error).to.be.exist;
      expect(error).to.be.an('error');
    });
    it('Should return an error', async () => {
      const { error } = await UserModel.aggregate([{ $match: { name: faker.random.string() } }]);
      expect(error.message).to.be.eq('Not found!');
    });
  });
  describe('On updateOne', async () => {
    let name;
    let updateData;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      await UsersFactory.Create({ name });
      updateData = { alias: faker.random.string() };
    });
    it('Should return an object', async () => {
      const updatedUser = await UserModel.updateOne(
        { name },
        updateData,
      );
      expect(updatedUser).to.be.an('Object');
    });
    it('Should change a field of user', async () => {
      const { user } = await UserModel.updateOne(
        { name },
        updateData,
      );
      expect(user.alias).to.be.eq(updateData.alias);
    });
    it('Should change the privateEmail field of user', async () => {
      const newField = { privateEmail: false };
      const { user } = await UserModel.updateOne(
        { privateEmail: true },
        newField,
      );
      expect(user.privateEmail).to.be.eq('false');
    });
    it('Should return an error if parameters are wrong', async () => {
      const { error } = await UserModel.updateOne(
        { name },
        faker.random.string(),
      );
      expect(error).to.be.exist;
    });
  });
  describe('On getFollowers', async () => {
    let user;
    beforeEach(async () => {
      user = await UsersFactory.Create();
    });
    it('Should return an array', async () => {
      const { users } = await UserModel.getFollowers({
        name: user.name,
        skip: 0,
        limit: 10,
      });
      expect(Array.isArray(users)).to.be.true;
    });
    it('Should return an error', async () => {
      const { error } = await UserModel.getFollowers({
        alias: _.random(0, 50),
        skip: user,
      });
      expect(error).to.be.exist;
    });
  });
  describe('On getFollowings', async () => {
    let name;

    beforeEach(async () => {
      name = faker.name.firstName();
      await UsersFactory.Create({ name });
    });
    it('Should return an array', async () => {
      const { users } = await UserModel.getFollowings({ name, skip: 0, limit: 10 });
      expect(Array.isArray(users)).to.be.true;
    });
    it('Should return an empty array', async () => {
      const { users } = await UserModel.getFollowings({ name, skip: 0, limit: 10 });
      expect(_.isEmpty(users));
    });
    it('Should return correct users array', async () => {
      name = faker.name.firstName();
      const followings = _.random(5, 15);
      const followingsArray = new Array(followings);
      await UsersFactory.Create({ name, users_follow: followingsArray });
      const { users } = await UserModel.getFollowings({ name, skip: 0, limit: followings });
      expect(users.length).to.be.eq(followings);
    });
  });
  describe('On search', async () => {
    let user;
    let options;
    beforeEach(async () => {
      await dropDatabase();
      user = await UsersFactory.Create();
      options = {
        string: user.name,
        skip: 0,
        limit: 10,
        notGuest: false,
      };
    });
    it('Should return a correct user', async () => {
      const { users } = await UserModel.search(options);
      expect(users[0].name).to.be.eq(user.name);
    });
    it('Should return an array', async () => {
      const { users } = await UserModel.search(options);
      expect(Array.isArray(users)).to.be.true;
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.search({
        test: _.random(0, 50),
        host: faker.random.string(),
        skip: user,
      });
      expect(error).to.be.exist;
    });
  });
  describe('On find', async () => {
    let name;
    let user;
    let userAlias;
    let condition;
    let usersCount;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      userAlias = faker.lorem.word();
      user = await UsersFactory.Create({ name, alias: userAlias });
      usersCount = _.random(1, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create();
      }
      condition = { alias: userAlias };
    });
    it('Should return an array', async () => {
      const { usersData } = await UserModel.find({
        condition,
        select: { alias: user.alias },
        skip: 0,
      });
      expect(Array.isArray(usersData)).to.be.true;
    });
    it('Should return correct user', async () => {
      const { usersData } = await UserModel.find({
        condition,
        select: { alias: user.alias },
        skip: 0,
      });
      expect(usersData[0].alias).to.be.eq(userAlias);
    });
    it('Should return an empty array if user not found', async () => {
      const wrongName = faker.name.firstName();
      const { usersData } = await UserModel.find({
        condition: { name: wrongName },
        select: { name: wrongName },
        sort: 'name',
        skip: 0,
        limit: 10,
      });
      expect(_.isEmpty(usersData)).to.be.true;
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.find({
        test: _.random(0, 50),
        host: faker.random.string(),
        skip: name,
      });
      expect(error).to.be.exist;
    });
  });
  describe('On findWithSelect', async () => {
    let usersCount;
    beforeEach(async () => {
      await dropDatabase();
      usersCount = _.random(1, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create({ name: `asdf_${faker.name.firstName()}` });
      }
    });
    it('Should return an array', async () => {
      const { result } = await UserModel.findWithSelect({},
        'name, alias');
      expect(Array.isArray(result)).to.be.true;
    });
    it('Should return correct user', async () => {
      await UsersFactory.Create();
      const { result } = await UserModel.findWithSelect({ name: { $in: [new RegExp('^asdf_')] } },
        'name, alias');
      expect(result.length).to.be.eq(usersCount);
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.findWithSelect([]);
      expect(error).to.be.exist;
    });
  });
  describe('On getCustomCount', async () => {
    let usersCount;
    beforeEach(async () => {
      await dropDatabase();
      usersCount = _.random(1, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create();
      }
    });
    it('should return correct number', async () => {
      const { count } = await UserModel.getCustomCount({});
      expect(count).to.be.eq(usersCount);
    });
    it('Should return an error if condition transmitted incorrectly', async () => {
      const { error } = await UserModel.getCustomCount(usersCount);
      expect(error).to.be.exist;
    });
  });
});
