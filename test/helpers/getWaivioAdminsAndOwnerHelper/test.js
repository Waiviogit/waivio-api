const {
  dropDatabase, faker, sinon, expect, getWaivioAdminsAndOwnerHelper, dropRedisDb,
} = require('test/testHelper');
const { AppFactory } = require('test/factories');
const { redisGetter } = require('utilities/redis');
const config = require('../../../config');
const { tagCategoriesClient } = require('../../../utilities/redis/redis');
const { WAIVIO_ADMINS } = require('../../../constants/common');

describe('On getWaivioAdminsAndOwnerHelper', () => {
  let owner, admin, admin2;

  beforeEach(async () => {
    await dropDatabase();
    await dropRedisDb();

    owner = faker.name.firstName();
    admin = faker.name.firstName();
    admin2 = faker.name.firstName();

    await AppFactory.Create({
      host: config.appHost,
      owner,
      admins: [admin, admin2],
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('On getWaivioAdminsAndOwner', () => {
    let result, redisData;

    it('should return owner and admins and set data in redis', async () => {
      result = await getWaivioAdminsAndOwnerHelper.getWaivioAdminsAndOwner();
      redisData = await redisGetter.smembersAsync(WAIVIO_ADMINS, tagCategoriesClient);

      expect(result).to.be.deep.eq([admin, admin2, owner]);
      expect(result.length).to.be.eq(3);
      expect(redisData[0]).to.be.eq(result.find((el) => el === redisData[0]));
      expect(redisData[1]).to.be.eq(result.find((el) => el === redisData[1]));
      expect(redisData[2]).to.be.eq(result.find((el) => el === redisData[2]));
      expect(redisData.length).to.be.deep.eq(result.length);
    });
  });
});
