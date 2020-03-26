const { faker, App } = require('test/testHelper');

const Create = async ({
  blacklists, name, admins, moderators, topUsers,
} = {}) => {
  const data = {
    name: name || faker.random.string(10),
    admins: admins || [faker.name.firstName().toLowerCase()],
    moderators: moderators || [],
    topUsers: topUsers || [],
    blacklists: blacklists || {
      users: [], wobjects: [], posts: [], apps: [],
    },
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
