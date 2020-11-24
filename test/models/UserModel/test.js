const {
  expect, UserModel, faker, dropDatabase,
} = require('test/testHelper');
const _ = require('lodash');
const { UsersFactory, WobjectFactory } = require('test/factories');

describe('UserModel', () => {
  describe('On getOne', () => {
    let name;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      await UsersFactory.Create({ name });
    });
    it('Should return the correct object', async () => {
      const { user } = await UserModel.getOne(name, ['name', 'wobjects_weight']);
      expect(user.name).to.be.eq(name);
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.getOne({ host: faker.random.string() });
      expect(error).to.be.exist;
    });
    it('Should return null when user can\'t be found', async () => {
      const { user: myUser } = await UserModel.getOne(faker.name.firstName());
      expect(myUser).to.be.null;
    });
  });
  describe('On findOneByCondition', async () => {
    let name, usersFollow;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      usersFollow = new Array(_.random(10, 40));
      await UsersFactory.Create({ name, users_follow: usersFollow });
    });
    it('Should return right user', async () => {
      await UsersFactory.Create();
      const { user } = await UserModel.findOneByCondition({ name, users_follow: usersFollow });
      expect(user.name).to.be.eq(name);
      expect(user.users_follow.length).to.be.eq(usersFollow.length);
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.findOneByCondition([]);
      expect(error).to.be.exist;
    });
  });
  describe('On getAll', async () => {
    let usersCount;
    beforeEach(async () => {
      await dropDatabase();
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
      const { error } = await UserModel.getAll({ limit: faker.lorem.word() });
      expect(error).to.be.exist;
    });
  });
  describe('On getObjectsFollow', async () => {
    let name, countUsers, limit, link;
    const userName = faker.name.firstName();
    beforeEach(async () => {
      await dropDatabase();
      countUsers = _.random(5, 10);
      limit = _.random(1, 5);
      name = faker.name.firstName();
      link = faker.random.string();
      for (let iter = 0; iter < countUsers; iter++) {
        await WobjectFactory.Create({ authorPermlink: link });
        await UsersFactory.Create({ name, objects_follow: [link] });
      }
      await WobjectFactory.Create({ authorPermlink: link });
      await UsersFactory.Create({ name: userName, objects_follow: [link] });
    });
    it('Should return an array', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({
        name,
      });
      expect(Array.isArray(wobjects)).to.be.true;
    });
    it('Should return empty array if username was not transmitted', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({ limit, skip: 0 });
      expect(wobjects).to.be.empty;
    });
    it('Should check that array isn\'t empty', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({
        name: userName,
      });
      expect(wobjects.length > 0).to.be.true;
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
      const { error } = await UserModel.aggregate({ name: faker.name.firstName() });
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
      updateData = faker.random.string();
    });
    it('Should return an object', async () => {
      const { user } = await UserModel.updateOne(
        { name },
        { alias: updateData },
      );
      expect(user.alias).to.be.eq(updateData);
    });
    it('Should change a field of user', async () => {
      const { user } = await UserModel.updateOne(
        { name },
        { alias: updateData },
      );
      expect(user.alias).to.be.eq(updateData);
    });
    it('Should change the privateEmail field of user', async () => {
      const { user } = await UserModel.updateOne(
        { privateEmail: true },
        { privateEmail: false },
      );
      expect(user.privateEmail === 'false').to.be.true;
    });
    it('Should return an error if parameters are wrong', async () => {
      const { error } = await UserModel.updateOne(
        { name },
        faker.random.string(),
      );
      expect(error).to.be.exist;
    });
  });
  describe('On search', async () => {
    let user, options;
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
    it('Should return an empty array if notGuest', async () => {
      options.notGuest = true;
      const { users } = await UserModel.search(options);
      expect(users).to.be.empty;
    });
    it('Should return an empty array if users was not found', async () => {
      options.string = faker.random.word();
      const { users } = await UserModel.search(options);
      expect(users).to.be.empty;
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
    let name, userAlias, condition, usersCount;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      userAlias = faker.lorem.word();
      usersCount = _.random(1, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create({ name, alias: userAlias });
      }
      condition = { alias: userAlias };
    });
    describe('Should chek that the user data are correct', async () => {
      let usersData;
      beforeEach(async () => {
        usersData = await UserModel.find({
          condition,
          select: { alias: userAlias },
          skip: 0,
        });
      });
      it('Should return an array', async () => {
        expect(Array.isArray(usersData.usersData)).to.be.true;
      });
      it('Should return correct user in array', async () => {
        expect(usersData.usersData[0].alias).to.be.eq(userAlias);
      });
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
      expect(usersData).to.be.empty;
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
    it('Should return correct users', async () => {
      await UsersFactory.Create();
      const { result } = await UserModel.findWithSelect({ name: { $in: [new RegExp('^asdf_')] } },
        'name, alias');
      expect(result.length).to.be.eq(usersCount);
    });
    it('Should return users with correct fields', async () => {
      const randomUser = _.random(0, usersCount - 1);
      await UsersFactory.Create();
      const { result } = await UserModel.findWithSelect({ name: { $in: [new RegExp('^asdf_')] } },
        'alias');
      expect(result[randomUser].alias).to.be.eq('');
      expect(result[randomUser].referral).to.be.undefined;
      expect(result[randomUser].stage_version).to.be.undefined;
    });
    it('Should return users with correct fields', async () => {
      const alias = faker.random.string();
      UsersFactory.Create({ name: `asdf_${faker.name.firstName()}`, alias });
      const { result } = await UserModel.findWithSelect({ name: { $in: [new RegExp('^asdf_')] } },
        { name: 1, alias: 1 });
      expect(result[0].objects_follow).to.be.undefined;
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.findWithSelect([]);
      expect(error).to.be.exist;
    });
  });
  describe('On getCustomCount', async () => {
    let usersCount, alias;
    beforeEach(async () => {
      await dropDatabase();
      alias = faker.random.string();
      usersCount = _.random(1, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create();
      }
    });
    it('Should return the number of all users', async () => {
      const { count } = await UserModel.getCustomCount({});
      expect(count).to.be.eq(usersCount);
    });
    it('Should return a correct number of users', async () => {
      const usersAliasCount = _.random(1, 10);
      for (let iter = 0; iter < usersAliasCount; iter++) {
        await UsersFactory.Create({ alias });
      }
      const { count } = await UserModel.getCustomCount({ alias });
      expect(count).to.be.eq(usersAliasCount);
    });
    it('Should return an error if condition transmitted incorrectly', async () => {
      const { error } = await UserModel.getCustomCount(usersCount);
      expect(error).to.be.exist;
    });
  });
});
