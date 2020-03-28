const { faker, App } = require('test/testHelper');

const Create = async ({
  blacklists, name, admins, moderators, supportedHashtags, supportedObjects,
} = {}) => {
  const data = {
    name: name || faker.random.string(10),
    admins: admins || [faker.name.firstName().toLowerCase()],
    moderators: moderators || [],
    supported_hashtags: supportedHashtags || [],
    supported_objects: supportedObjects || [],
    black_list_users: blacklists || [],
    daily_chosen_post: {
      author: faker.name.firstName().toLowerCase(),
      permlink: faker.random.string(),
      title: faker.random.string(20),
    },
    weekly_chosen_post: {
      author: faker.name.firstName().toLowerCase(),
      permlink: faker.random.string(),
      title: faker.random.string(20),
    },
  };

  return App.create(data);
};

module.exports = { Create };
