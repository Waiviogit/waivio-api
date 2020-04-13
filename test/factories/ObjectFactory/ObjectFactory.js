const _ = require('lodash');
const { faker, WObject } = require('test/testHelper');

const Create = async ({
  author, authorPermlink, defaultName, creator, latestPosts
} = {}) => {
  const object = {
    author: author || faker.name.firstName().toLowerCase(),
    author_permlink: authorPermlink || faker.random.string(20),
    default_name: defaultName || faker.name.firstName(),
    creator: creator || faker.name.firstName(),
    latest_posts: latestPosts,
  };

  const newObject = await WObject.create(object);
  return newObject.toObject();
};
module.exports = { Create };
