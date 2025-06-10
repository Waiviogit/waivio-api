const _ = require('lodash');
const { FIELDS_NAMES } = require('@waivio/objects-processor');
const {
  Wobj, Campaign, User, wobjectSubscriptions,
} = require('../../../models');
const {
  REQUIREDFIELDS, OBJECT_TYPES, REMOVE_OBJ_STATUSES,
} = require('../../../constants/wobjectsData');
const { CACHE_KEY, TTL_TIME } = require('../../../constants/common');
const { campaignsHelper, wObjectHelper } = require('../../helpers');
const { getCountryCodeFromIp } = require('../../helpers/sitesHelper');
const { getCachedData, setCachedData } = require('../../helpers/cacheHelper');
const { addNewCampaignsToObjects } = require('../../helpers/campaignsV2Helper');
const redisSetter = require('../../redis/redisSetter');
const {
  processAppAffiliate,
} = require('../affiliateProgram/processAffiliate');
const wobjectHelper = require('../../helpers/wObjectHelper');
const { getWobjectCanonical } = require('../../helpers/cannonicalHelper');
const { isMobileDevice } = require('../../../middlewares/context/contextHelper');
const { WAIVIO_AFFILIATE_HOSTS } = require('../../../constants/affiliateData');
const {
  reMakeAffiliateLinksOnList,
  makeAffiliateLinks,
} = require('../affiliateProgram/makeAffiliateLinks');

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
      mobile: isMobileDevice(),
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

// scanEmbedded
const getAllObjectsInList = async ({
  authorPermlink, app, scanEmbedded,
}) => {
  const result = [authorPermlink];
  const queue = [authorPermlink];
  const processedLists = new Set();

  while (queue.length > 0) {
    const currentList = queue.shift();
    processedLists.add(currentList);

    const { result: wobject, error } = await Wobj.findOne({
      author_permlink: currentList,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    });

    if (error || !wobject) continue;
    if (wobject.object_type !== OBJECT_TYPES.LIST) continue;

    const wobj = await wObjectHelper.processWobjects({
      wobjects: [wobject],
      fields: [FIELDS_NAMES.LIST_ITEM, FIELDS_NAMES.MENU_ITEM],
      app,
      returnArray: false,
      mobile: isMobileDevice(),
    });

    const listWobjects = _.map(_.get(wobj, FIELDS_NAMES.LIST_ITEM, []), 'body');

    const { result: listFromDb } = await Wobj.find(
      { author_permlink: { $in: listWobjects } },
      { object_type: 1, author_permlink: 1, metaGroupId: 1 },
    );

    for (const item of listFromDb) {
      if (result.includes(item.author_permlink)) continue;

      if (item.object_type === OBJECT_TYPES.LIST && !processedLists.has(item.author_permlink)) {
        queue.push(item.author_permlink);
        result.push(item.author_permlink);
        continue;
      }
      if ([OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK].includes(item.object_type)
        && item.metaGroupId) {
        const { result: metaIdClones } = await Wobj.findObjects({
          filter: {
            metaGroupId: item.metaGroupId,
          },
          projection: { author_permlink: 1 },
        });

        if (metaIdClones.length)result.push(...metaIdClones.map((el) => el.author_permlink));
        continue;
      }
      result.push(item.author_permlink);
    }
    if (!scanEmbedded) break;
  }

  return result;
};

const getAllObjectsInListForImport = async ({
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
      mobile: isMobileDevice(),
    });
    const listWobjects = _.map(_.get(wobj, FIELDS_NAMES.LIST_ITEM, []), 'body');

    if (_.isEmpty(listWobjects)) return handledItems;

    for (const item of listWobjects) {
      // condition for exit from looping
      if (!handledItems.includes(item)) {
        handledItems.push(item);
        if (scanEmbedded) {
          await getAllObjectsInListForImport({
            authorPermlink: item, handledItems, app, recursive: true, scanEmbedded,
          });
        }
      }
    }
  }
  return handledItems;
};

const getListDepartments = async ({
  authorPermlink, handledItems = [], app, scanEmbedded, departments = [], listItems = [],
}) => {
  const { result: wobject, error } = await Wobj.findOne({
    author_permlink: authorPermlink,
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  });
  if (error || !wobject) return handledItems;

  const localDepartments = [...departments];

  if ([OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK].includes(wobject.object_type)) {
    const { result } = await Wobj.findObjects({
      filter: {
        metaGroupId: wobject.metaGroupId,
      },
      projection: { author_permlink: 1 },
    });
    if (result.length) {
      handledItems.push({
        departments: localDepartments,
        objects: result.map((el) => el.author_permlink),
      });
    }
  }
  if (wobject.object_type === OBJECT_TYPES.LIST) {
    const wobj = await wObjectHelper.processWobjects({
      wobjects: [wobject],
      fields: [FIELDS_NAMES.LIST_ITEM, FIELDS_NAMES.MENU_ITEM, FIELDS_NAMES.NAME],
      app,
      returnArray: false,
      mobile: isMobileDevice(),
    });
    localDepartments.push(wobj?.name ?? wobj.default_name);
    const listWobjects = _.map(_.get(wobj, FIELDS_NAMES.LIST_ITEM, []), 'body');

    if (_.isEmpty(listWobjects)) return handledItems;

    for (const item of listWobjects) {
      const { result: listItem } = await Wobj.findOne({
        author_permlink: item,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      }, { object_type: 1 });
      const conditionToEnter = listItem?.object_type !== OBJECT_TYPES.LIST
        || !listItems.includes(item);
      // condition for exit from looping

      if (conditionToEnter) {
        const isList = listItem?.object_type === OBJECT_TYPES.LIST;
        if (isList) listItems.push(item);
        if (isList && !scanEmbedded) continue;

        await getListDepartments({
          authorPermlink: item,
          handledItems,
          scanEmbedded,
          app,
          departments: localDepartments,
          listItems,
        });
      }
    }
  }
  return handledItems;
};

const getAllListPermlinks = async ({ authorPermlink, app, scanEmbedded }) => {
  const handledItems = [authorPermlink];
  const result = await getAllObjectsInListForImport({
    authorPermlink, app, handledItems, scanEmbedded,
  });
  return { result: _.uniq(result) };
};

const getListsForAuthority = async ({ authorPermlink, scanEmbedded, app }) => {
  const result = await getAllObjectsInList({
    authorPermlink, scanEmbedded, app,
  });
  return { result: _.uniq(result) };
};

const getListItems = async ({
  wobject, ip, app, locale, userName,
}) => {
  const filteredUnavailable = _.filter(wobject.fields, (f) => f.name === FIELDS_NAMES.LIST_ITEM);

  const { result: available } = await Wobj.find({
    author_permlink: { $in: _.map(filteredUnavailable, 'body') },
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  });

  const availableObjects = _.map(available, 'author_permlink');

  const fieldsToProcess = _.filter(wobject.fields, (f) => _.includes(availableObjects, f.body));
  const newObject = _.cloneDeep(wobject);
  newObject.fields = fieldsToProcess;

  const countryCode = await getCountryCodeFromIp(ip);

  const affiliateCodes = await processAppAffiliate({
    app,
    locale,
  });

  const fields = (await wObjectHelper.processWobjects({
    locale,
    fields: [FIELDS_NAMES.LIST_ITEM],
    wobjects: [newObject],
    returnArray: false,
    app,
    mobile: isMobileDevice(),
  }))[FIELDS_NAMES.LIST_ITEM];

  let { result: wobjects } = await Wobj.find(
    {
      author_permlink: { $in: _.map(fields, 'body') },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    },
    { search: 0, departments: 0 },
  );

  if (!fields) return { wobjects: [] };

  let user;
  if (userName) {
    ({ user } = await User.getOne(userName));
  }

  wobjects = await Promise.all(wobjects.map(async (wobj) => {
    const fieldInList = _.find(fields, (field) => field.body === wobj.author_permlink);
    if (wobj.object_type.toLowerCase() === 'list') {
      wobj.listItemsCount = wobj.fields.filter((f) => f.name === FIELDS_NAMES.LIST_ITEM).length;
    }
    wobj = await wObjectHelper.processWobjects({
      locale,
      fields: [...REQUIREDFIELDS, FIELDS_NAMES.PROMOTION],
      wobjects: [wobj],
      returnArray: false,
      app,
      countryCode,
      reqUserName: userName,
      affiliateCodes,
      mobile: isMobileDevice(),
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

const getOne = async ({
  authorPermlink, app, locale, user, countryCode, ip,
}) => { // get one wobject by author_permlink
  const { wObject, error: getWobjError } = await Wobj.getOne(authorPermlink);
  if (getWobjError) return { error: getWobjError };
  const { count } = await wobjectSubscriptions.getFollowersCount(wObject.author_permlink);
  wObject.followers_count = count || 0;

  // format listItems field
  const keyName = wObject.object_type.toLowerCase() === OBJECT_TYPES.LIST ? 'listItems' : 'menuItems';
  if (_.find(wObject.fields, { name: FIELDS_NAMES.LIST_ITEM })) {
    const { wobjects } = await getListItems({
      wobject: wObject, ip, locale, app, userName: user,
    });
    if (wobjects && wobjects.length) wObject[keyName] = wobjects;
  }

  // eslint-disable-next-line prefer-const
  let [affiliateCodes, wobjectData] = await Promise.all([
    processAppAffiliate({ app, locale }),
    wobjectHelper.processWobjects({
      wobjects: [wObject],
      app,
      hiveData: true,
      returnArray: false,
      locale,
      countryCode,
      reqUserName: user,
      mobile: isMobileDevice(),
    }),
  ]);

  wobjectData.affiliateLinks = makeAffiliateLinks({
    productIds: wobjectData.productId,
    affiliateCodes,
    countryCode,
    objectType: wobjectData.object_type,
  });

  const conditionToRemakeLinks = !wobjectData?.affiliateLinks?.length
    && !WAIVIO_AFFILIATE_HOSTS.includes(app?.host)
    && wobjectData?.productId?.length;

  if (conditionToRemakeLinks) {
    const [object] = await reMakeAffiliateLinksOnList({
      objects: [wobjectData],
      app,
      locale,
      countryCode,
    });
    wobjectData = object;
  }

  wobjectData.canonical = await getWobjectCanonical({
    owner: wobjectData.descriptionCreator,
    authorPermlink,
    host: app?.host,
  });

  wobjectData.updatesCount = _.sumBy(wobjectData.exposedFields, 'value');
  delete wobjectData.fields;
  delete wobjectData.search;

  return { wobjectData };
};

const getAuthorPermlinkByIdType = async ({ id, idType }) => {
  const searchData = [
    JSON.stringify({ companyId: id, companyIdType: idType }),
    JSON.stringify({ companyIdType: idType, companyId: id }),
    JSON.stringify({ productId: id, productIdType: idType }),
    JSON.stringify({ productIdType: idType, productId: id }),
  ];

  const { result } = await Wobj.findOne({ 'fields.body': { $in: searchData } }, { author_permlink: 1 });

  return { result: result?.author_permlink || '' };
};

const getAuthorPermlinkByFieldBody = async ({ body, objectType }) => {
  const { result } = await Wobj.findOne(
    {
      'fields.body': body,
      ...(objectType && { object_type: objectType }),
    },
    { author_permlink: 1 },
  );

  return { result: result?.author_permlink || '' };
};

module.exports = {
  getOne,
  getItemsCount,
  getAllListPermlinks,
  getListDepartments,
  getAllObjectsInList,
  getListsForAuthority,
  getAuthorPermlinkByIdType,
  getAuthorPermlinkByFieldBody,
};
