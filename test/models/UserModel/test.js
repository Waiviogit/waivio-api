const {
  expect, UserModel, faker, dropDatabase,
} = require('test/testHelper');
const _ = require('lodash');
const { UsersFactory, ObjectFactory } = require('test/factories');

describe('UserModel', () => {
  describe('On getOne', () => {
    let name, alias;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      alias = faker.random.word();
      await UsersFactory.Create({ name, alias });
    });
    it('Should return the object with correct name', async () => {
      const { user } = await UserModel.getOne(name, ['name']);
      expect(user.name).to.be.eq(name);
    });
    it('Should check that select works', async () => {
      const { user } = await UserModel.getOne(name, ['alias']);
      expect(user).to.have.keys('alias', '_id', 'objects_following_count');
    });
    it('Should check that user does not have field alias', async () => {
      const { user } = await UserModel.getOne(name, ['-alias']);
      expect(user).to.not.have.keys('alias');
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.getOne({});
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
    it('Should return user with right name', async () => {
      await UsersFactory.Create();
      const { user } = await UserModel.findOneByCondition({ name });
      expect(user.name).to.be.eq(name);
    });
    it('Should return user with right users_follow', async () => {
      await UsersFactory.Create();
      const { user } = await UserModel.findOneByCondition({ users_follow: usersFollow });
      expect(user.users_follow).to.have.length(usersFollow.length);
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
    let name, limit, link;
    const userName = faker.name.firstName();
    beforeEach(async () => {
      await dropDatabase();
      limit = _.random(1, 5);
      name = faker.name.firstName();
      link = faker.random.string();
      await UsersFactory.Create({ name, objects_follow: [link] });
      await ObjectFactory.Create({ authorPermlink: link });
      await UsersFactory.Create({ name: userName, objects_follow: [link] });
    });
    it('Should return an array', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({
        name,
      });
      expect(wobjects).to.be.an('array');
    });
    it('Should return empty array if username was not transmitted', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({ limit, skip: 0 });
      expect(wobjects).to.be.empty;
    });
    it('Should check that array isn\'t empty', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({
        name: userName,
      });
      expect(wobjects).to.be.an('array').that.is.not.empty;
    });
    it('Should return object with correct link', async () => {
      const { wobjects } = await UserModel.getObjectsFollow({
        name: userName,
      });
      expect(wobjects[0].author_permlink).to.be.eq(link);
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
        await UsersFactory.Create({ name: `asdf_${faker.random.string()}` });
      }
    });
    describe('Should test array', async () => {
      let result;
      beforeEach(async () => {
        await UsersFactory.Create();
        result = await UserModel.aggregate([
          {
            $match: {
              name: new RegExp('^asdf_'),
            },
          }]);
      });
      it('Should return an array', async () => {
        expect(result.result).to.be.an('array');
      });
      it('Should return not empty array', async () => {
        expect(result.result).to.have.length(usersCount);
      });
    });
    it('Should return an error if pipeline is not correct', async () => {
      const { error } = await UserModel.aggregate({ name: faker.name.firstName() });
      expect(error).to.be.exist;
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
    it('Should change a field of user', async () => {
      const { user } = await UserModel.updateOne(
        { name },
        { alias: updateData },
      );
      expect(user.alias).to.be.eq(updateData);
    });
    it('Should change the privateEmail field of user', async () => {
      const newEmail = faker.random.string();
      const { user } = await UserModel.updateOne(
        { name },
        { privateEmail: newEmail },
      );
      expect(user.privateEmail).to.be.eq(newEmail);
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
      user = await UsersFactory.Create({ name: `asdf_${faker.name.firstName()}` });
      options = {
        string: 'asdf',
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
      expect(users).to.be.an('array');
    });
    it('Should return an empty array if users was not found', async () => {
      options.string = faker.random.word();
      const { users } = await UserModel.search(options);
      expect(users).to.be.empty;
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.search({
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
      usersCount = _.random(5, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create({ alias: userAlias });
      }
      condition = { alias: userAlias };
    });
    describe('Should chek that the user data are correct with select', async () => {
      let usersData;
      beforeEach(async () => {
        ({ usersData } = await UserModel.find({
          condition,
          select: { alias: userAlias },
          sort: { count_posts: 1 },
          skip: 0,
        }));
      });
      it('Should return an array', async () => {
        expect(usersData).to.be.an('array');
      });
      it('Should return user with correct field alias in array', async () => {
        expect(usersData[0]).to.have.keys('alias', '_id', 'objects_following_count');
      });
      it('Should return user excludes alias field', async () => {
        ({ usersData } = await UserModel.find({
          condition,
          select: '-alias',
          sort: { count_posts: 1 },
          skip: 0,
        }));
        expect(usersData[0]).to.not.include.keys('alias');
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
    it('Should return sorted users', async () => {
      const limit = 5;
      const { usersData } = await UserModel.find({
        condition,
        sort: { count_posts: 1 },
        skip: 0,
        limit,
      });
      expect(usersData[limit - 1].count_posts).to.be.above(usersData[0].count_posts);
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
      const { result } = await UserModel.findWithSelect(
        {},
        'name, alias',
      );
      expect(result).to.be.an('array');
    });
    it('Should return correct users', async () => {
      await UsersFactory.Create();
      const { result } = await UserModel.findWithSelect(
        { name: { $in: [new RegExp('^asdf_')] } },
        'name, alias',
      );
      expect(result.length).to.be.eq(usersCount);
    });
    it('Should return users with correct fields', async () => {
      const randomUser = _.random(0, usersCount - 1);
      await UsersFactory.Create();
      const { result } = await UserModel.findWithSelect(
        { name: { $in: [new RegExp('^asdf_')] } },
        'alias',
      );
      expect(result[randomUser].alias).to.be.eq('');
    });
    it('Should check that the error exists', async () => {
      const { error } = await UserModel.findWithSelect([]);
      expect(error).to.be.exist;
    });
  });
  describe('On getCustomCount', async () => {
    let usersCount, alias, usersAliasCount;
    beforeEach(async () => {
      await dropDatabase();
      alias = faker.random.string();
      usersCount = _.random(1, 10);
      for (let iter = 0; iter < usersCount; iter++) {
        await UsersFactory.Create();
      }
      usersAliasCount = _.random(1, 10);
      for (let iter = 0; iter < usersAliasCount; iter++) {
        await UsersFactory.Create({ alias });
      }
    });
    it('Should return the number of all users', async () => {
      const allUsers = usersCount + usersAliasCount;
      const { count } = await UserModel.getCustomCount({});
      expect(count).to.be.eq(allUsers);
    });
    it('Should return a correct number of users with alias field', async () => {
      const { count } = await UserModel.getCustomCount({ alias });
      expect(count).to.be.eq(usersAliasCount);
    });
    it('Should return an error if condition transmitted incorrectly', async () => {
      const { error } = await UserModel.getCustomCount(usersCount);
      expect(error).to.be.exist;
    });
  });
});
