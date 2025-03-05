const {
  faker, dropDatabase, dropRedisDb, expect, sinon, UserWobjectsModel,
} = require('test/testHelper');
const _ = require('lodash');
const { cacheAllWobjectExperts } = require('utilities/helpers/cacheAllWobjectExperts');
const { redisGetter } = require('utilities/redis');
const ObjectFactory = require('test/factories/ObjectFactory/ObjectFactory');
const UserWobjectsFactory = require('test/factories/UserWobjectsFactory/UserWobjectsFactory');

describe('on cacheAllWobjectExperts', async () => {
  let authorPermlink;
  beforeEach(async () => {
    await dropDatabase();
    await dropRedisDb();
    authorPermlink = faker.random.string(10);

    await ObjectFactory.Create({
      authorPermlink,
    });
    for (let i = 0; i < _.random(6, 15); i++) {
      await UserWobjectsFactory.Create({
        authorPermlink,
        weight: _.random(1, 1000),
      });
    }
  });
  afterEach(() => {
    sinon.restore();
  });
  it('the saved array of experts in Redis must contain the same names as the array of experts in MongoDB', async () => {
    const redisExpertsNames = [];
    const mongoExpertsNames = [];
    await cacheAllWobjectExperts(1);

    const redisData = await redisGetter.getTopWobjUsers(authorPermlink);
    for (const data of redisData) {
      const experts = data.split(':');
      redisExpertsNames.push(experts[0]);
    }

    const { result: mongoData } = await UserWobjectsModel.find({ author_permlink: authorPermlink }, { weight: -1 }, 5);
    for (const data of mongoData) {
      mongoExpertsNames.push(data.user_name);
    }
    expect(redisExpertsNames).to.have.members(mongoExpertsNames);
  });
});
