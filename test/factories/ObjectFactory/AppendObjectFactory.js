const { faker, WObject } = require('test/testHelper');
const ObjectFactory = require('test/factories/ObjectFactory/ObjectFactory');

const Create = async ({
  creator, name, weight, body, rootWobj, additionalFields = {},
  activeVotes, id, administrative, ownership,
} = {}) => {
  const appendObject = {
    name: name || 'city',
    body: body || faker.address.city(),
    locale: 'en-US',
    weight: weight || faker.random.number(1000),
    creator: creator || faker.name.firstName().toLowerCase(),
    author: faker.name.firstName().toLowerCase(),
    permlink: faker.random.string(20),
    active_votes: activeVotes || [],
  };
  for (const key in additionalFields) appendObject[key] = additionalFields[key];
  if (id) appendObject.id = id;
  rootWobj = rootWobj || `${faker.random.string(3)}-${faker.address.city().replace(/ /g, '')}`;
  let wobject = await WObject.findOne({ author_permlink: rootWobj }).lean();

  if (!wobject) {
    wobject = await ObjectFactory.Create({
      authorPermlink: rootWobj, fields: [appendObject], administrative, ownership,
    });
  } else {
    await WObject.updateOne({ author_permlink: rootWobj }, { $addToSet: { fields: appendObject } });
    wobject = await WObject.findOne({ author_permlink: rootWobj }).lean();
  }
  return { appendObject, rootWobj, wobject };
};

module.exports = { Create };
