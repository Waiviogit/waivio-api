const _ = require('lodash');
const {
  faker,
  dropDatabase,
  expect,
  sinon,
} = require('test/testHelper');
const {
  AppFactory,
  ObjectTypeFactory,
  ObjectFactory,
  UsersFactory,
  SubscriptionsFactory,
  UserWobjectsFactory,
} = require('test/factories');
const {
  FIELDS_NAMES,
  OBJECT_TYPES,
} = require('constants/wobjectsData');
const { getObjectGroup } = require('../../../../utilities/operations/wobject/objectGroup');

describe('On getObjectGroup', async () => {
  let app, admin, admin2, administrative, ownership, ownershipObject, objectType;


  beforeEach(async () => {
    await dropDatabase();
    objectType = await ObjectTypeFactory.Create(
      { exposedFields: _.difference(Object.values(FIELDS_NAMES), [FIELDS_NAMES.PRICE]) },
    );
    admin = faker.name.firstName();
    admin2 = faker.name.firstName();
    administrative = faker.name.firstName();
    ownershipObject = faker.random.string();
    ownership = faker.name.firstName();
    app = await AppFactory.Create({
      admins: [admin, admin2],
      authority: [ownership, administrative],
      ownershipObjects: [ownershipObject],
    });
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('On GROUP_FOLLOWERS field', async () => {
    let obj, result;

    const follower1 = faker.random.string();
    const follower2 = faker.random.string();
    const followers = [follower1, follower2];

    const follows = faker.random.string();

    beforeEach(async () => {
      obj = await ObjectFactory.Create({
        weight: 1,
        objectType: OBJECT_TYPES.GROUP,
        fields: [{
          weight: 1,
          name: FIELDS_NAMES.GROUP_FOLLOWERS,
          body: JSON.stringify([follows]),
        }],
      });

      for (const follower of followers) {
        await UsersFactory.Create({ name: follower });
        await SubscriptionsFactory.Create({ follower, following: follows });
      }

      result = await getObjectGroup({
        authorPermlink: obj.author_permlink,
        app,
      });
    });

    it('should have length 2', async () => {
      expect(result?.result?.length === 2).to.be.true;
    });

    it('should contain all followers', async () => {
      for (const user of result.result) {
        expect(followers.includes(user.name)).to.be.true;
      }
    });
  });

  describe('On GROUP_EXCLUDE on GROUP_FOLLOWERS field', async () => {
    let obj, result;

    const follower1 = faker.random.string();
    const follower2 = faker.random.string();
    const followers = [follower1, follower2];

    const follows = faker.random.string();

    beforeEach(async () => {
      obj = await ObjectFactory.Create({
        weight: 1,
        objectType: OBJECT_TYPES.GROUP,
        fields: [{
          weight: 1,
          name: FIELDS_NAMES.GROUP_FOLLOWERS,
          body: JSON.stringify([follows]),
        },
        {
          weight: 1,
          name: FIELDS_NAMES.GROUP_EXCLUDE,
          body: follower2,
        },
        ],
      });

      for (const follower of followers) {
        await UsersFactory.Create({ name: follower });
        await SubscriptionsFactory.Create({ follower, following: follows });
      }

      result = await getObjectGroup({
        authorPermlink: obj.author_permlink,
        app,
      });
    });

    it('should have length 1', async () => {
      expect(result?.result?.length === 1).to.be.true;
    });

    it('should exclude follower2', async () => {
      const users = _.map(result.result, (el) => el.name);
      expect(!users.includes(follower2)).to.be.true;
    });
    it('should include follower1', async () => {
      const users = _.map(result.result, (el) => el.name);
      expect(users.includes(follower1)).to.be.true;
    });
  });

  describe('On GROUP_FOLLOWING field', async () => {
    let obj, result;

    const follower1 = faker.random.string();
    const follower2 = faker.random.string();
    const followings = [follower1, follower2];

    const follower = faker.random.string();

    beforeEach(async () => {
      obj = await ObjectFactory.Create({
        weight: 1,
        objectType: OBJECT_TYPES.GROUP,
        fields: [{
          weight: 1,
          name: FIELDS_NAMES.GROUP_FOLLOWING,
          body: JSON.stringify([follower]),
        }],
      });

      for (const following of followings) {
        await UsersFactory.Create({ name: following });
        await SubscriptionsFactory.Create({ follower, following });
      }

      result = await getObjectGroup({
        authorPermlink: obj.author_permlink,
        app,
      });
    });

    it('should have length 2', async () => {
      expect(result?.result?.length === 2).to.be.true;
    });

    it('should contain all followings', async () => {
      for (const user of result.result) {
        expect(followings.includes(user.name)).to.be.true;
      }
    });
  });

  describe('On GROUP_EXCLUDE on GROUP_FOLLOWING field', async () => {
    let obj, result;

    const follower1 = faker.random.string();
    const follower2 = faker.random.string();
    const followings = [follower1, follower2];

    const follower = faker.random.string();

    beforeEach(async () => {
      obj = await ObjectFactory.Create({
        weight: 1,
        objectType: OBJECT_TYPES.GROUP,
        fields: [
          {
            weight: 1,
            name: FIELDS_NAMES.GROUP_FOLLOWING,
            body: JSON.stringify([follower]),
          },
          {
            weight: 1,
            name: FIELDS_NAMES.GROUP_EXCLUDE,
            body: follower2,
          },
        ],
      });

      for (const following of followings) {
        await UsersFactory.Create({ name: following });
        await SubscriptionsFactory.Create({ follower, following });
      }

      result = await getObjectGroup({
        authorPermlink: obj.author_permlink,
        app,
      });
    });

    it('should have length 1', async () => {
      expect(result?.result?.length === 1).to.be.true;
    });

    it('should exclude follower2', async () => {
      const users = _.map(result.result, (el) => el.name);
      expect(!users.includes(follower2)).to.be.true;
    });
    it('should include follower1', async () => {
      const users = _.map(result.result, (el) => el.name);
      expect(users.includes(follower1)).to.be.true;
    });
  });

  describe('On GROUP_EXPERTISE field', async () => {
    let obj, result;

    const follower1 = faker.random.string();
    const follower2 = faker.random.string();
    const followings = [follower1, follower2];

    const authorPermlink = faker.random.string();

    beforeEach(async () => {
      obj = await ObjectFactory.Create({
        weight: 1,
        objectType: OBJECT_TYPES.GROUP,
        fields: [{
          weight: 1,
          name: FIELDS_NAMES.GROUP_EXPERTISE,
          body: JSON.stringify([authorPermlink]),
        }],
      });

      for (const following of followings) {
        await UsersFactory.Create({ name: following });
        await UserWobjectsFactory.Create({ authorPermlink, userName: following });
      }

      result = await getObjectGroup({
        authorPermlink: obj.author_permlink,
        app,
      });
    });

    it('should contain all followings', async () => {
      for (const user of result.result) {
        expect(followings.includes(user.name)).to.be.true;
      }
    });
  });

  describe('On GROUP_EXCLUDE on GROUP_EXPERTISE field', async () => {
    let obj, result;

    const follower1 = faker.random.string();
    const follower2 = faker.random.string();
    const followings = [follower1, follower2];

    const authorPermlink = faker.random.string();

    beforeEach(async () => {
      obj = await ObjectFactory.Create({
        weight: 1,
        objectType: OBJECT_TYPES.GROUP,
        fields: [
          {
            weight: 1,
            name: FIELDS_NAMES.GROUP_EXPERTISE,
            body: JSON.stringify([authorPermlink]),
          },
          {
            weight: 1,
            name: FIELDS_NAMES.GROUP_EXCLUDE,
            body: follower2,
          },
        ],
      });

      for (const following of followings) {
        await UsersFactory.Create({ name: following });
        await UserWobjectsFactory.Create({ authorPermlink, userName: following });
      }

      result = await getObjectGroup({
        authorPermlink: obj.author_permlink,
        app,
      });
    });

    it('should have length 1', async () => {
      expect(result?.result?.length === 1).to.be.true;
    });

    it('should exclude follower2', async () => {
      const users = _.map(result.result, (el) => el.name);
      expect(!users.includes(follower2)).to.be.true;
    });

    it('should include follower1', async () => {
      const users = _.map(result.result, (el) => el.name);
      expect(users.includes(follower1)).to.be.true;
    });
  });

  describe('On GROUP_ADD field', async () => {
    let obj, result;

    const follower1 = faker.random.string();
    const follower2 = faker.random.string();
    const followings = [follower1, follower2];

    beforeEach(async () => {
      obj = await ObjectFactory.Create({
        weight: 1,
        objectType: OBJECT_TYPES.GROUP,
        fields: [{
          weight: 1,
          name: FIELDS_NAMES.GROUP_ADD,
          body: follower1,
        },
        {
          weight: 1,
          name: FIELDS_NAMES.GROUP_ADD,
          body: follower2,
        },
        ],
      });

      for (const following of followings) {
        await UsersFactory.Create({ name: following });
      }

      result = await getObjectGroup({
        authorPermlink: obj.author_permlink,
        app,
      });
    });

    it('should have length 2', async () => {
      expect(result?.result?.length === 2).to.be.true;
    });

    it('should contain all followings', async () => {
      for (const user of result.result) {
        expect(followings.includes(user.name)).to.be.true;
      }
    });
  });

  describe('On GROUP_EXCLUDE on GROUP_ADD field', async () => {
    let obj, result;

    const follower1 = faker.random.string();
    const follower2 = faker.random.string();
    const followings = [follower1, follower2];

    beforeEach(async () => {
      obj = await ObjectFactory.Create({
        weight: 1,
        objectType: OBJECT_TYPES.GROUP,
        fields: [{
          weight: 1,
          name: FIELDS_NAMES.GROUP_ADD,
          body: follower1,
        },
        {
          weight: 1,
          name: FIELDS_NAMES.GROUP_EXCLUDE,
          body: follower2,
        },
        ],
      });

      for (const following of followings) {
        await UsersFactory.Create({ name: following });
      }

      result = await getObjectGroup({
        authorPermlink: obj.author_permlink,
        app,
      });
    });

    it('should have length 1', async () => {
      expect(result?.result?.length === 1).to.be.true;
    });

    it('should exclude follower2', async () => {
      const users = _.map(result.result, (el) => el.name);
      expect(!users.includes(follower2)).to.be.true;
    });
    it('should include follower1', async () => {
      const users = _.map(result.result, (el) => el.name);
      expect(users.includes(follower1)).to.be.true;
    });
  });
});
