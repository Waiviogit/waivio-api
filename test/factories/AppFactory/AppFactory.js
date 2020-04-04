const { faker, App } = require('test/testHelper');

const Create = async ({
  blacklists, name, admins, moderators, supportedHashtags, supportedObjects, bots,
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
    service_bots: bots || [],
  };

  const app = await App.create(data);
  return app.toObject();
};

module.exports = { Create };
