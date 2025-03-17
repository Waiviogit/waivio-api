const { ObjectType, faker } = require('test/testHelper');
const { FIELDS_NAMES } = require('constants/wobjectsData');

const Create = async ({
  name, author, permlink, updatesBlacklist, supposedUpdates, exposedFields,
} = {}) => {
  const data = {
    name: name || faker.random.string(10),
    author: author || faker.name.firstName().toLowerCase(),
    permlink: permlink || faker.random.string(),
    exposedFields: exposedFields || Object.values(FIELDS_NAMES),
  };
  if (updatesBlacklist) data.updates_blacklist = updatesBlacklist;
  if (supposedUpdates) data.supposed_updates = supposedUpdates;

  const objectType = await ObjectType.findOneAndUpdate({ name: data.name }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
  return objectType._doc;
};

module.exports = { Create };
