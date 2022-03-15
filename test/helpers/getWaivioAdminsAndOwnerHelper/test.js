const {
  dropDatabase, faker, sinon, expect, getWaivioAdminsAndOwnerHelper, dropRedisDb,
} = require('test/testHelper');
const { AppFactory } = require('test/factories');
const { redisGetter } = require('utilities/redis');
const config = require('../../../config');

describe('On getWaivioAdminsAndOwnerHelper', () => {
  let owner, admin, admin2;

  beforeEach(async () => {
    await dropDatabase();
    await dropRedisDb();

    owner = faker.name.firstName();
    admin = faker.name.firstName();
    admin2 = faker.name.firstName();

    await AppFactory.Create({
      host: config.waivio_auth.host,
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
      redisData = await redisGetter.getAdminsByOwner(owner);

      expect(result.waivioOwner).to.be.eq(owner);
      expect(result.waivioAdmins).to.be.deep.eq([admin, admin2]);
      expect(result.waivioAdmins.length).to.be.eq(2);
      expect(redisData[0]).to.be.eq(result.waivioAdmins.find((el) => el === redisData[0]));
      expect(redisData[1]).to.be.eq(result.waivioAdmins.find((el) => el === redisData[1]));
      expect(redisData.length).to.be.eq(result.waivioAdmins.length);
    });
  });
});
