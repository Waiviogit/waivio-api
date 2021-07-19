const { faker, WObject } = require('test/testHelper');

const Create = async ({
  author, authorPermlink, defaultName, creator, map, weight, app,
  latestPosts, fields, objectType, administrative, ownership, searchWords,
} = {}) => {
  const object = {
    authority: {
      administrative: administrative || [faker.random.string()],
      ownership: ownership || [faker.random.string()],
    },
    object_type: objectType,
    author: author || faker.name.firstName().toLowerCase(),
    author_permlink: authorPermlink || faker.random.string(20),
    default_name: defaultName || faker.name.firstName(),
    creator: creator || faker.name.firstName(),
    map: map || null,
    app: app || '',
    latest_posts: latestPosts,
    fields: fields || [],
    weight: weight || 1,
    search: searchWords || [],
  };

  const newObject = await WObject.create(object);
  return newObject.toObject();
};

module.exports = { Create };
