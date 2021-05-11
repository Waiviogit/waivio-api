const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const {
  Wobj, Campaign, User, App, wobjectSubscriptions,
} = require('models');
const { REQUIREDFIELDS, FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');
const { campaignsHelper, wObjectHelper } = require('utilities/helpers');

/**
 * Method for get count of all included items(using recursive call)
 * Return count only last nodes(which not list or menu)
 * @param authorPermlink {String} Permlink of list
 * @param recursive {Boolean} Boolean flag for recursive call
 * @param handledItems {String[]} Array of author_permlinks which already handled(to avoid looping)
 * @param app {String} Get app admins and wobj administrators in processWobjects
 * @returns {Promise<number>}
 */
const getItemsCount = async (authorPermlink, handledItems, recursive = false, app) => {
  let count = 0;
  const { result: wobject, error } = await Wobj.findOne({ author_permlink: authorPermlink });
  if (error || !wobject) return 0;
  if (wobject.object_type === OBJECT_TYPES.LIST) {
    const wobj = await wObjectHelper.processWobjects({
      wobjects: [wobject],
      fields: [FIELDS_NAMES.LIST_ITEM, FIELDS_NAMES.MENU_ITEM],
      app,
      returnArray: false,
    });
    const listWobjects = _.map(_.get(wobj, FIELDS_NAMES.LIST_ITEM, []), 'body');

    if (_.isEmpty(listWobjects)) return recursive ? 1 : 0;

    for (const item of listWobjects) {
    // condition for exit from looping
      if (!handledItems.includes(item)) {
        handledItems.push(item);
        count += await getItemsCount(item, handledItems, true);
      }
    }
  } else count++;
  return count;
};

const getListItems = async (wobject, data, app) => {
  const fields = (await wObjectHelper.processWobjects({
    locale: data.locale,
    fields: [FIELDS_NAMES.LIST_ITEM],
    wobjects: [_.cloneDeep(wobject)],
    returnArray: false,
    app,
  }))[FIELDS_NAMES.LIST_ITEM];
  if (!fields) return { wobjects: [] };
  let { result: wobjects } = await Wobj.find({ author_permlink: { $in: _.map(fields, 'body') } });

  let user;
  if (data.userName) {
    ({ user } = await User.getOne(data.userName));
  }

  wobjects = await Promise.all(wobjects.map(async (wobj) => {
    if (wobj.object_type.toLowerCase() === 'list') {
      wobj.listItemsCount = wobj.fields.filter((f) => f.name === FIELDS_NAMES.LIST_ITEM).length;
    }
    wobj = await wObjectHelper.processWobjects({
      locale: data.locale, fields: REQUIREDFIELDS, wobjects: [wobj], returnArray: false, app,
    });
    wobj.type = _.find(fields, (field) => field.body === wobj.author_permlink).type;
    wobj.listItemsCount = await getItemsCount(
      wobj.author_permlink,
      [wobject.author_permlink, wobj.author_permlink],
      app,
    );
    const { result, error } = await Campaign.findByCondition({ objects: wobj.author_permlink, status: 'active' });
    if (error || !result.length) return wobj;
    wobj.propositions = await campaignsHelper.campaignFilter(result, user, app);
    return wobj;
  }));
  return { wobjects };
};

const getOne = async (data) => { // get one wobject by author_permlink
  const { wObject, error: getWobjError } = await Wobj.getOne(data.author_permlink);
  if (getWobjError) return { error: getWobjError };

  const { count } = await wobjectSubscriptions.getFollowersCount(wObject.author_permlink);
  wObject.followers_count = count || 0;

  let app;
  if (data.appName) {
    const session = getNamespace('request-session');
    const host = session.get('host');
    ({ result: app } = await App.findOne({ host }));
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
