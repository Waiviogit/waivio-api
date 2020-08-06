const _ = require('lodash');
const {
  Wobj, Campaign, User, App,
} = require('models');
const { REQUIREDFIELDS } = require('utilities/constants');
const { objectTypeHelper, wObjectHelper } = require('utilities/helpers');

const getParentInfo = async (wObject, data, admins) => {
  const { parent } = await wObjectHelper.processWobjects({
    fields: ['parent'], wobjects: [_.cloneDeep(wObject)], returnArray: false, locale: data.locale, admins,
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
  if (error) return 0;

  const listWobjects = _.map(_.filter(wobject.fields, (field) => field.name === 'listItem'), 'body');

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

const getListItems = async (wobject, data, admins) => {
  const fields = _.filter(wobject.fields, (field) => field.name === 'listItem');
  const { result: wobjects } = await Wobj.find({ author_permlink: { $in: _.map(fields, 'body') } });

  for (let obj of wobjects) {
    if (obj.object_type.toLowerCase() === 'list') {
      obj.listItemsCount = obj.fields.filter((f) => f.name === 'listItem').length;
    }
    obj = await wObjectHelper.processWobjects({
      locale: data.locale, fields: REQUIREDFIELDS, wobjects: [obj], returnArray: false, admins,
    });

    obj.parent = await getParentInfo(obj, data, admins);

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

  let admins = [];
  if (data.appName) {
    const { app } = await App.getOne({ name: data.appName });
    if (app) admins = app.admins;
  }

  // format listItems field
  const keyName = wObject.object_type.toLowerCase() === 'list' ? 'listItems' : 'menuItems';
  if (_.find(wObject.fields, { name: 'listItem' })) {
    const { wobjects } = await getListItems(wObject, data, admins);
    wObject[keyName] = wobjects;
  }

  return { wobjectData: wObject };
};

module.exports = {
  getOne,
};
