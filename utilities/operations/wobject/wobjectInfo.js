const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const {
  Wobj, Campaign, User, App, wobjectSubscriptions,
} = require('models');
const {
  REQUIREDFIELDS, FIELDS_NAMES, OBJECT_TYPES, REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const { CACHE_KEY, TTL_TIME } = require('constants/common');
const { campaignsHelper, wObjectHelper } = require('utilities/helpers');
const { getCountryCodeFromIp } = require('utilities/helpers/sitesHelper');
const { getCachedData, setCachedData } = require('utilities/helpers/cacheHelper');
const { addNewCampaignsToObjects } = require('../../helpers/campaignsV2Helper');
const redisSetter = require('../../redis/redisSetter');
const { processAppAffiliate } = require('../affiliateProgram/processAffiliate');

/**
 * Method for get count of all included items(using recursive call)
 * Return count only last nodes(which not list or menu)
 * @param authorPermlink {String} Permlink of list
 * @param recursive {Boolean} Boolean flag for recursive call
 * @param handledItems {String[]} Array of author_permlinks which already handled(to avoid looping)
 * @param app {String} Get app admins and wobj administrators in processWobjects
 * @returns {Promise<number>}
 */
const getItemsCount = async ({
  authorPermlink, handledItems, app, recursive = false,
}) => {
  let count = 0;
  const { result: wobject, error } = await Wobj.findOne({
    author_permlink: authorPermlink,
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  });
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
        count += await getItemsCount({
          authorPermlink: item, handledItems, app, recursive: true,
        });
      }
    }
  } else count++;
  return count;
};

const getAllObjectsInList = async ({
  authorPermlink, handledItems = [], app, scanEmbedded,
}) => {
  const { result: wobject, error } = await Wobj.findOne({
    author_permlink: authorPermlink,
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  });
  if (error || !wobject) return handledItems;

  if ([OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK].includes(wobject.object_type)
    && wobject.metaGroupId) {
    const { result } = await Wobj.findObjects({
      filter: {
        author_permlink: { $ne: wobject.author_permlink },
        metaGroupId: wobject.metaGroupId,
      },
      projection: { author_permlink: 1 },
    });
    if (result.length)handledItems.push(...result.map((el) => el.author_permlink));
  }
  if (wobject.object_type === OBJECT_TYPES.LIST) {
    const wobj = await wObjectHelper.processWobjects({
      wobjects: [wobject],
      fields: [FIELDS_NAMES.LIST_ITEM, FIELDS_NAMES.MENU_ITEM],
      app,
      returnArray: false,
    });
    const listWobjects = _.map(_.get(wobj, FIELDS_NAMES.LIST_ITEM, []), 'body');

    if (_.isEmpty(listWobjects)) return handledItems;

    for (const item of listWobjects) {
      // condition for exit from looping
      if (!handledItems.includes(item)) {
        handledItems.push(item);
        if (scanEmbedded) {
          await getAllObjectsInList({
            authorPermlink: item, handledItems, app, recursive: true,
          });
        }
      }
    }
  }
  return handledItems;
};

const getAllListPermlinks = async ({ authorPermlink, app, scanEmbedded }) => {
  const handledItems = [authorPermlink];
  const result = await getAllObjectsInList({
    authorPermlink, app, handledItems, scanEmbedded,
  });
  return { result: _.uniq(result) };
};

const getListItems = async (wobject, data, app) => {
  const filteredUnavailable = _.filter(wobject.fields, (f) => f.name === FIELDS_NAMES.LIST_ITEM);

  const { result: available } = await Wobj.find({
    author_permlink: { $in: _.map(filteredUnavailable, 'body') },
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  });

  const availableObjects = _.map(available, 'author_permlink');

  const fieldsToProcess = _.filter(wobject.fields, (f) => _.includes(availableObjects, f.body));
  const newObject = _.cloneDeep(wobject);
  newObject.fields = fieldsToProcess;

  const countryCode = await getCountryCodeFromIp(data.ip);

  const affiliateCodes = await processAppAffiliate({
    app,
    locale: data.locale,
  });

  const fields = (await wObjectHelper.processWobjects({
    locale: data.locale,
    fields: [FIELDS_NAMES.LIST_ITEM],
    wobjects: [newObject],
    returnArray: false,
    app,
  }))[FIELDS_NAMES.LIST_ITEM];

  let { result: wobjects } = await Wobj.find({
    author_permlink: { $in: _.map(fields, 'body') },
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  });

  if (!fields) return { wobjects: [] };

  let user;
  if (data.user) {
    ({ user } = await User.getOne(data.user));
  }

  wobjects = await Promise.all(wobjects.map(async (wobj) => {
    const fieldInList = _.find(fields, (field) => field.body === wobj.author_permlink);
    if (wobj.object_type.toLowerCase() === 'list') {
      wobj.listItemsCount = wobj.fields.filter((f) => f.name === FIELDS_NAMES.LIST_ITEM).length;
    }
    wobj = await wObjectHelper.processWobjects({
      locale: data.locale,
      fields: REQUIREDFIELDS,
      wobjects: [wobj],
      returnArray: false,
      app,
      countryCode,
      reqUserName: data.user,
      affiliateCodes,
    });
    wobj.type = _.get(fieldInList, 'type');
    // caching of items count the most slow query // can't be done inside because of recursive fn
    const key = `${CACHE_KEY.LIST_ITEMS_COUNT}:${wobject.author_permlink}:${wobj.author_permlink}:${app?.host}`;
    const cache = await getCachedData(key);
    if (cache) {
      wobj.listItemsCount = Number(cache);
      await redisSetter.expire({ key, ttl: TTL_TIME.SEVEN_DAYS });
    } else {
      // authorPermlink = added list item ,
      const count = await getItemsCount({
        authorPermlink: wobj.author_permlink,
        handledItems: [wobject.author_permlink, wobj.author_permlink],
        app,
      });
      wobj.listItemsCount = count;
      await setCachedData({
        key, data: count, ttl: TTL_TIME.SEVEN_DAYS,
      });
    }

    wobj.addedAt = fieldInList._id && fieldInList._id.getTimestamp();
    const { result, error } = await Campaign.findByCondition({ objects: wobj.author_permlink, status: 'active' });
    if (error || !result.length) return wobj;
    wobj.propositions = await campaignsHelper.campaignFilter(result, user, app);
    return wobj;
  }));
  await addNewCampaignsToObjects({ user, wobjects });

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
  getItemsCount,
  getAllListPermlinks,
};
