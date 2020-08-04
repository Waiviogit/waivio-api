const _ = require('lodash');
const { Wobj, Campaign, User } = require('models');
const { REQUIREDFIELDS, REQUIREDFIELDS_PARENT } = require('utilities/constants');
const { objectTypeHelper, wObjectHelper } = require('utilities/helpers');

const getOne = async (data) => { // get one wobject by author_permlink
  const { wObject, error: getWobjError } = await Wobj.getOne(data.author_permlink);
  if (getWobjError) return { error: getWobjError };

  const { count } = await User.getCustomCount({ objects_follow: wObject.author_permlink });
  wObject.followers_count = count || 0;

  const parent = await wObjectHelper.processWobjects({
    fields: ['parent'], wobjects: [wObject], returnArray: false,
  }).parent;
  if (parent) {
    // Temporary solution
    wObject.parent = await Wobj.getOne(parent);
    if (data.flag) {
      wObject.parent = await wObjectHelper.processWobjects({
        locale: data.locale,
        fields: REQUIREDFIELDS_PARENT,
        wobjects: [wObject.parent],
        returnArray: false,
        appName: data.appName,
      });
    } else getRequiredFields(wObject.parent, REQUIREDFIELDS_PARENT);
  } else wObject.parent = '';

  const requiredFields = _.cloneDeep(REQUIREDFIELDS);

  // format listItems field
  if (_.find(wObject.fields, { name: 'listItem' })) {
    const { wobjects, sortCustom } = await getListItems(wObject, data.user, data.appName);
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

const getListItems = async (wobject, userName, appName) => {
  // const { fields, error: listError } = await Wobj.getList(authorPermlink);
  // if (listError) return { error: listError };
  const fields = _.filter(wobject.fields, (field) => field.name === 'listItem');

  const sortCustom = await wObjectHelper.processWobjects({
    fields: ['sortCustom'], wobjects: [wobject], returnArray: false, appName,
  }).body || '[]';

  const { result: wobjects } = await Wobj.find({ author_permlink: { $in: _.map(fields, 'body') } }, { path: 'parent' });
  // const wobjects = _.compact(_.map(fields.filter((field) => field.name === 'listItem' && !_.isEmpty(field.wobject)), (field) => ({ ...field.wobject, alias: field.alias })));
  // #TODO CONTINUE
  wobjects.forEach((wObject) => {
    if (wObject.object_type.toLowerCase() === 'list') {
      wObject.listItemsCount = wObject.fields.filter((f) => f.name === 'listItem').length;
    }
    getRequiredFields(wObject, [...REQUIREDFIELDS]);
    if (wObject && wObject.parent) {
      getRequiredFields(wObject.parent, [...REQUIREDFIELDS_PARENT]);
    }
  });

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
