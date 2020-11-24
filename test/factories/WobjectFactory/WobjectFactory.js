const { WObject, faker } = require('test/testHelper');

const Create = async (
  {
    app, community, objectType, defaultName, creator,
    author, authorPermlink, weight, countPosts, parent, children, latestPosts,
    status, fields,
  } = {}) => {
  const wobjectData = {
    app: app || faker.random.word(),
    community: community || faker.random.word(),
    object_type: objectType || faker.random.word(),
    default_name: defaultName || faker.random.word(),
    creator: creator || faker.name.firstName(),
    author: author || faker.name.firstName(),
    author_permlink: authorPermlink || faker.random.word(),
    weight: weight || 0,
    count_posts: countPosts || 0,
    parent: parent || '',
    children: children || [],
    latestPosts: latestPosts || [],
    status: status || '',
    fields: fields || [],
  };
  const wobject = new WObject(wobjectData);
  wobject.save();
  return wobject.toObject();
};

module.exports = { Create };
