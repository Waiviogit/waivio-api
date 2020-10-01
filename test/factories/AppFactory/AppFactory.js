const { faker, App, ObjectID } = require('test/testHelper');
const { STATUSES } = require('constants/sitesConstants');

const Create = async ({
  blacklists, name, admins, moderators, supportedHashtags,
  supportedObjects, bots, authority, inherited, canBeExtended, deactivatedAt,
  host, owner, status, configuration, filters, supportedTypes, parent,
} = {}) => {
  const data = {
    host: host || faker.internet.domainWord(),
    owner: owner || faker.random.string(10),
    status: status || STATUSES.PENDING,
    name: name || faker.random.string(10),
    admins: admins || [faker.name.firstName().toLowerCase()],
    parent: parent || new ObjectID(),
    moderators: moderators || [],
    deactivatedAt: deactivatedAt || null,
    supported_hashtags: supportedHashtags || [],
    supported_objects: supportedObjects || [],
    configuration: configuration || { configurationFields: [faker.random.string()] },
    authority: authority || [],
    object_filters: filters || { restaurant: { feature: [] } },
    canBeExtended: canBeExtended || false,
    supported_object_types: supportedTypes || ['restaurant'],
    inherited: inherited || true,
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
