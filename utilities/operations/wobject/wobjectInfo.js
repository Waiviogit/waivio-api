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
  const { wobjects: listWobjects, error } = await Wobj.getList(authorPermlink);
  if (error) return 0;

  if (_.isEmpty(listWobjects)) return 1;

  for (const item of listWobjects) {
    // condition for exit from looping
    if (!handledItems.includes(item.author_permlink)) {
      handledItems.push(item.author_permlink);
      count += await getItemsCount(item.author_permlink, handledItems);
    }
  }
  return count;
};

const getListItems = async (wobject, data, admins) => {
  const fields = _.filter(wobject.fields, (field) => field.name === 'listItem');

  const sortCustom = (await wObjectHelper.processWobjects({
    fields: ['sortCustom'], wobjects: [_.cloneDeep(wobject)], returnArray: false, admins,
  })).sortCustom || '[]';

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

  return { wobjects, sortCustom };
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

  const requiredFields = _.cloneDeep(REQUIREDFIELDS);

  // format listItems field
  if (_.find(wObject.fields, { name: 'listItem' })) {
    const { wobjects, sortCustom } = await getListItems(wObject, data, admins);
    const keyName = wObject.object_type.toLowerCase() === 'list' ? 'listItems' : 'menuItems';
    wObject[keyName] = wobjects;
    wObject.sortCustom = sortCustom;
    requiredFields.push('sortCustom', 'listItem');
  }
  // format gallery
  // #TODO DELETE after implement new logic
  wObject.preview_gallery = _.orderBy(wObject.fields.filter((field) => field.name === 'galleryItem'), ['weight'], ['asc']).slice(0, 3);
  wObject.albums_count = wObject.fields.filter((field) => field.name === 'galleryAlbum').length;
  wObject.photos_count = wObject.fields.filter((field) => field.name === 'galleryItem').length;

  // add additional fields to returning
  if (data.required_fields) requiredFields.push(...data.required_fields);

  // get only required fields for wobject
  getRequiredFields(wObject, requiredFields);
  return { wobjectData: wObject };
};

const getRequiredFields = (wObject, requiredFields) => {
  wObject.fields = wObject.fields.filter((item) => requiredFields.includes(item.name));
};

module.exports = {
  getOne,
};
