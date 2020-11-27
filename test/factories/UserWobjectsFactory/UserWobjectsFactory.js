const { UserWobjects, faker } = require('test/testHelper');

const Create = async ({ userName, authorPermlink, weight } = {}) => {
  const userWobjectData = {
    user_name: userName || faker.name.firstName(),
    author_permlink: authorPermlink || faker.internet.url(),
    weight: weight || 0,
  };
  const userWobject = new UserWobjects(userWobjectData);
  await userWobject.save();

  return userWobject.toObject();
};

module.exports = { Create };
