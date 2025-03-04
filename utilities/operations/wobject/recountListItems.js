const { Wobj, App } = require('../../../models');
const { OBJECT_TYPES, FIELDS_NAMES } = require('../../../constants/wobjectsData');
const { setCachedData } = require('../../helpers/cacheHelper');
const { CACHE_KEY, TTL_TIME } = require('../../../constants/common');
const redisGetter = require('../../redis/redisGetter');
const { getItemsCount } = require('./wobjectInfo');

const getPairs = async ({ authorPermlink, setOfPairs }) => {
  const { result } = await Wobj.findObjects({
    filter: { fields: { $elemMatch: { body: authorPermlink, name: 'listItem' } } },
    projection: { author_permlink: 1 },
  });
  if (!result.length) return setOfPairs;

  for (const resultElement of result) {
    const key = `${resultElement.author_permlink}:${authorPermlink}`;
    if (setOfPairs.has(key)) continue;
    // now authorPermlink is added to parent list
    setOfPairs.add(key);
    // if exist pair not enter here
    await getPairs({
      authorPermlink: resultElement.author_permlink,
      setOfPairs,
    });
  }
  return setOfPairs;
};

const getCachedKeys = async (keysToCheck) => {
  const keys = [];
  for (const keyCheck of keysToCheck) {
    const key = `${CACHE_KEY.LIST_ITEMS_COUNT}:${keyCheck}*`;
    const redisKeys = await redisGetter.keys({ key });
    if (redisKeys.length) {
      keys.push(...redisKeys);
    }
  }

  return keys;
};

const getAppsFromKeys = async (keys) => {
  const hosts = keys
    .map((el) => { const [,,, host] = el.split(':'); return host; })
    .filter((el, index, self) => index === self.indexOf(el));
  const { result, error } = await App.find({
    host: { $in: hosts },
  });
  if (error) return [];
  return result;
};

const recountItems = async ({ addedObject = {}, mainObject }) => {
  const setOfPairs = new Set();

  const mainListItems = mainObject.fields
    .filter((el) => el.name === FIELDS_NAMES.LIST_ITEM).map((el) => el.body);
  // find parents
  const updatedSet = await getPairs({
    authorPermlink: mainObject.author_permlink,
    setOfPairs,
  });
  const keysToCheck = [...updatedSet];
  if (addedObject.object_type === OBJECT_TYPES.LIST) {
    keysToCheck.push(`${mainObject.author_permlink}:${addedObject.author_permlink}`);
  }

  const keysToUpdate = await getCachedKeys(keysToCheck);
  if (!keysToUpdate.length) return;

  const apps = await getAppsFromKeys(keysToUpdate);

  for (const key of keysToUpdate) {
    const [, main, added, host] = key.split(':');
    const app = apps.find((el) => el.host === host);
    if (!app) continue;
    if (main === mainObject.author_permlink && mainListItems.includes(added)) {
      continue;
    }

    const count = await getItemsCount({
      authorPermlink: added,
      handledItems: [main, added],
      app,
    });

    await setCachedData({
      key,
      data: count,
      ttl: TTL_TIME.SEVEN_DAYS,
    });
  }
};

const recountListItems = async ({ authorPermlink, listItemLink }) => {
  const { wObject: mainObject, error: mainObjErr } = await Wobj.getOne(authorPermlink);
  const { wObject: addedObject } = await Wobj.getOne(listItemLink);
  if (mainObjErr) return { error: mainObjErr };

  recountItems({
    addedObject, mainObject,
  });

  return { result: 'OK' };
};

module.exports = recountListItems;
