const _ = require('lodash');
const { Wobj, Campaign, User } = require('models');
const { REQUIREDFIELDS, REQUIREDFIELDS_PARENT } = require('utilities/constants');
const { objectTypeHelper, wObjectHelper } = require('utilities/helpers');

const getOne = async (data) => { // get one wobject by author_permlink
  const { wObject, error: getWobjError } = await Wobj.getOne(data.author_permlink);

  if (getWobjError) return { error: getWobjError };

  if (wObject.parent) {
    // Temporary solution
    if (data.flag) {
      wObject.parent = await wObjectHelper.processWobjects({
        locale: data.locale,
        fields: REQUIREDFIELDS_PARENT,
        wobjects: [wObject.parent],
        returnArray: false,
        appName: data.appName,
      });
    } else getRequiredFields(wObject.parent, REQUIREDFIELDS_PARENT);
  }
  const requiredFields = _.cloneDeep(REQUIREDFIELDS);

  // format listItems field
  if (await Wobj.isFieldExist({ author_permlink: data.author_permlink, fieldName: 'listItem' })) {
    const { wobjects, sortCustom } = await getListItems(data.author_permlink, data.user);
    const keyName = wObject.object_type.toLowerCase() === 'list' ? 'listItems' : 'menuItems';
    wObject[keyName] = wobjects;
    wObject.sortCustom = sortCustom;
    requiredFields.push('sortCustom', 'listItem');
  }
  // format gallery
  wObject.preview_gallery = _.orderBy(wObject.fields.filter((field) => field.name === 'galleryItem'), ['weight'], ['asc']).slice(0, 3);
  wObject.albums_count = wObject.fields.filter((field) => field.name === 'galleryAlbum').length;
  wObject.photos_count = wObject.fields.filter((field) => field.name === 'galleryItem').length;

  wObject.followers_count = wObject.followers.length;
  delete wObject.followers;

  // add additional fields to returning
  if (data.required_fields) requiredFields.push(...data.required_fields);

  // get only required fields for wobject, parent wobjects and child objects
  getRequiredFields(wObject, requiredFields);
  if (wObject.parent_objects) {
    wObject.parent_objects.forEach((parent) => getRequiredFields(parent, requiredFields));
  }
  if (wObject.child_objects) {
    wObject.child_objects.forEach((child) => getRequiredFields(child, requiredFields));
  }
  return { wobjectData: wObject };
};

const getRequiredFields = (wObject, requiredFields) => {
  wObject.fields = wObject.fields.filter((item) => requiredFields.includes(item.name));
};

const getListItems = async (authorPermlink, userName) => {
  const { wobjects, sortCustom, error: listError } = await Wobj.getList(authorPermlink);
  if (listError) console.error(listError);

  for (const listWobj of wobjects) {
    listWobj.listItemsCount = await getItemsCount(
      listWobj.author_permlink,
      [authorPermlink, listWobj.author_permlink],
    );
  }

  let user;
  if (userName) {
    user = await User.getOne(userName);
  }
  await Promise.all(wobjects.map(async (wobj) => {
    const { result, error } = await Campaign.findByCondition({ objects: wobj.author_permlink, status: 'active' });
    if (error || !result.length) return;
    wobj.propositions = await objectTypeHelper.campaignFilter(result, _.get(user, 'user', null));
  }));
  return { wobjects, sortCustom };
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

module.exports = {
  getOne,
};
