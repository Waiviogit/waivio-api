const wObjectHelper = require('utilities/helpers/wObjectHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { Wobj } = require('models');
const _ = require('lodash');

const getMongoFilterForShop = (field) => _.reduce(field, (acc, el, index) => {
  if (index === 'type') {
    acc.object_type = field[index];
    return acc;
  }
  if (index === 'departments') {
    acc.$and = _.map(field[index], (department) => ({ departments: department }));
    return acc;
  }
  if (index === 'tags') {
    acc.fields = { $elemMatch: { name: 'categoryItem', body: { $in: field[index] } } };
    return acc;
  }
  if (index === 'authorities') {
    acc.$or = _.flatten(_.map(field[index], (user) => [
      { 'authority.ownership': user },
      { 'authority.administrative': user },
    ]));
    return acc;
  }
  return acc;
}, {});

const getWobjectFilter = async ({ authorPermlink, app }) => {
  const { result } = await Wobj.findOne({ author_permlink: authorPermlink });
  if (!result) return { error: { status: 404, message: 'Not Found' } };
  const processedObject = await wObjectHelper.processWobjects({
    wobjects: [result],
    returnArray: false,
    app,
    fields: [FIELDS_NAMES.SHOP_FILTER],
  });

  if (!processedObject[FIELDS_NAMES.SHOP_FILTER]) return { error: { status: 404, message: 'Not Found' } };
  const field = jsonHelper.parseJson(processedObject[FIELDS_NAMES.SHOP_FILTER], null);
  if (_.isEmpty(field)) return { error: { status: 404, message: 'Not Found' } };

  return { filter: getMongoFilterForShop(field) };
};

module.exports = async ({ authorPermlink, app }) => {
  const { filter, error } = await getWobjectFilter({ app, authorPermlink });
  if (error) return { error };
};
