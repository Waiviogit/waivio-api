const { MutedUser, faker } = require('test/testHelper');

const Create = async ({ userName, mutedBy, mutedForApps } = {}) => {
  const data = {
    userName: userName || faker.random.string(),
    mutedBy: mutedBy || [faker.random.string()],
    mutedForApps: mutedForApps || [faker.random.string()],
  };

  const mutedUser = new MutedUser(data);
  await mutedUser.save();

  return mutedUser.toObject();
};

module.exports = { Create };
