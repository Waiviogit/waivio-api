const _ = require('lodash');
const {
  Wobj, Campaign, User, App,
} = require('models');
const { REQUIREDFIELDS, FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');
const { objectTypeHelper, wObjectHelper } = require('utilities/helpers');

const getParentInfo = async (wObject, data, app) => {
  const { parent } = await wObjectHelper.processWobjects({
    fields: [FIELDS_NAMES.PARENT],
    wobjects: [_.cloneDeep(wObject)],
    returnArray: false,
    locale: data.locale,
    app,
  });
  return parent || '';
};

/**
 * Method for get count of all included items(using recursive call)
 * Return count only last nodes(which not list or menu)
 * @param authorPermlink {String} Permlink of list
 * @param handledItems {String[]} Array of author_permlinks which already handled(to avoid looping)
 * @returns {Promise<number>}
 */
const getItemsCount = async (authorPermlink, handledItems) => {
  let count = 0;
  const { result: wobject, error } = await Wobj.findOne(authorPermlink);
  if (error || !wobject) return 0;

  const listWobjects = _.map(_.filter(wobject.fields, (field) => field.name === FIELDS_NAMES.LIST_ITEM), 'body');

  if (_.isEmpty(listWobjects)) return 1;

  for (const item of listWobjects) {
    // condition for exit from looping
    if (!handledItems.includes(item)) {
      handledItems.push(item);
      count += await getItemsCount(item, handledItems);
    }
  }
  return count;
};

const getListItems = async (wobject, data, app) => {
  // const fields = _.filter(wobject.fields, (field) => field.name === FIELDS_NAMES.LIST_ITEM);
  const fields = (await wObjectHelper.processWobjects({
    locale: data.locale,
    fields: [FIELDS_NAMES.LIST_ITEM],
    wobjects: [_.cloneDeep(wobject)],
    returnArray: false,
    app,
  }))[FIELDS_NAMES.LIST_ITEM];
  if (!fields) return { wobjects: [] };
  const { result: wobjects } = await Wobj.find({ author_permlink: { $in: _.map(fields, 'body') } });

  for (let obj of wobjects) {
    if (obj.object_type.toLowerCase() === 'list') {
      obj.listItemsCount = obj.fields.filter((f) => f.name === FIELDS_NAMES.LIST_ITEM).length;
    }
    obj = await wObjectHelper.processWobjects({
      locale: data.locale, fields: REQUIREDFIELDS, wobjects: [obj], returnArray: false, app,
    });
    obj.type = _.find(fields, (field) => field.body === obj.author_permlink).type;
    obj.parent = await getParentInfo(obj, data, app);

    obj.listItemsCount = await getItemsCount(
      obj.author_permlink,
      [wobject.author_permlink, obj.author_permlink],
    );
  }

  let user;
  if (data.userName) {
    ({ user } = await User.getOne(data.userName));
  }
  await Promise.all(wobjects.map(async (wobj) => {
    const { result, error } = await Campaign.findByCondition({ objects: wobj.author_permlink, status: 'active' });
    if (error || !result.length) return;
    wobj.propositions = await objectTypeHelper.campaignFilter(result, user);
  }));

  return { wobjects };
};

const getOne = async (data) => { // get one wobject by author_permlink
  const { wObject, error: getWobjError } = await Wobj.getOne(data.author_permlink);
  if (getWobjError) return { error: getWobjError };

  const { count } = await User.getCustomCount({ objects_follow: wObject.author_permlink });
  wObject.followers_count = count || 0;

  let app;
  if (data.appName) {
    ({ app } = await App.getOne({ name: data.appName }));
  }

  // format listItems field
  const keyName = wObject.object_type.toLowerCase() === OBJECT_TYPES.LIST ? 'listItems' : 'menuItems';
  if (_.find(wObject.fields, { name: FIELDS_NAMES.LIST_ITEM })) {
    const { wobjects } = await getListItems(wObject, data, app);
    if (wobjects && wobjects.length) wObject[keyName] = wobjects;
  }

  return { wobjectData: wObject };
};

module.exports = {
  getOne,
};
