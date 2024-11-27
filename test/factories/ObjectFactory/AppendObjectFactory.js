const moment = require('moment');
const _ = require('lodash');
const { ObjectId } = require('mongoose').Types;
const { faker, WObject } = require('test/testHelper');
const ObjectFactory = require('test/factories/ObjectFactory/ObjectFactory');

const Create = async ({
  creator, name, weight, body, rootWobj, additionalFields = {}, tagCategory,
  activeVotes, id, administrative, ownership, timestamp, objectType, map, permlink, startDate, endDate
} = {}) => {
  const appendObject = {
    _id: objectIdFromDateString(timestamp || moment.utc().valueOf()),
    name: name || 'city',
    body: body || faker.address.city(),
    locale: 'en-US',
    weight: weight || faker.random.number(1000),
    creator: creator || faker.name.firstName().toLowerCase(),
    author: faker.name.firstName().toLowerCase(),
    permlink: permlink || faker.random.string(20),
    active_votes: activeVotes || [],
    startDate,
    endDate,
  };
  if (tagCategory) appendObject.tagCategory = tagCategory;
  for (const key in additionalFields) appendObject[key] = additionalFields[key];
  if (id) appendObject.id = id;
  rootWobj = rootWobj || `${faker.random.string(3)}-${faker.address.city().replace(/ /g, '')}`;
  let wobject = await WObject.findOne({ author_permlink: rootWobj }).lean();

  if (!wobject) {
    wobject = await ObjectFactory.Create({
      authorPermlink: rootWobj, fields: [appendObject], administrative, ownership, objectType, map,
    });
  } else {
    await WObject.updateOne({ author_permlink: rootWobj }, { $addToSet: { fields: appendObject } });
    wobject = await WObject.findOne({ author_permlink: rootWobj }).lean();
  }
  return { appendObject, rootWobj, wobject };
};

const objectIdFromDateString = (timestamp) => {
  const str = `${Math.floor(timestamp / 1000).toString(16)}${_.random(10000, 99999)}00000000000`;
  return new ObjectId(str);
};

module.exports = { Create, objectIdFromDateString };
