const { ObjectType, faker } = require('test/testHelper');

const Create = async ({
  name, author, permlink, updatesBlacklist, supposedUpdates,
} = {}) => {
  const data = {
    name: name || faker.random.string(10),
    author: author || faker.name.firstName().toLowerCase(),
    permlink: permlink || faker.random.string(),
  };
  if (updatesBlacklist) data.updates_blacklist = updatesBlacklist;
  if (supposedUpdates) data.supposed_updates = supposedUpdates;

  const objectType = await ObjectType.findOneAndUpdate(
    { name: data.name }, data, { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return objectType._doc;
};

module.exports = { Create };
