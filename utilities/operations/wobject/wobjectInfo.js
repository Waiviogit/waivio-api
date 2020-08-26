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

const prepareObject = async ({
  object, fields, data, app, permlink, user,
}) => {
  if (object.object_type.toLowerCase() === 'list') {
    object.listItemsCount = object.fields.filter((f) => f.name === FIELDS_NAMES.LIST_ITEM).length;
  }
  object = await wObjectHelper.processWobjects({
    locale: data.locale, fields: REQUIREDFIELDS, wobjects: [object], returnArray: false, app,
  });
  object.type = _.find(fields, (field) => field.body === object.author_permlink).type;
  object.parent = await getParentInfo(object, data, app);

  object.listItemsCount = await getItemsCount(
    object.author_permlink,
    [permlink, object.author_permlink],
  );
  const { result } = await Campaign.findByCondition({ objects: object.author_permlink, status: 'active' });
  if (result && result.length) {
    object.propositions = await objectTypeHelper.campaignFilter(result, user);
  }
  return object;
};

const getListItems = async (wobject, data, app, key) => {
  let user, wobjects = [];
  if (data.userName) {
    ({ user } = await User.getOne(data.userName));
  }
  switch (key) {
    case 'menuItems':
      const clonedObject = _.cloneDeep(wobject);
      clonedObject.fields.map((field) => {
        field.name = field.name === FIELDS_NAMES.LIST_ITEM ? FIELDS_NAMES.MENU_ITEM : field.name;
        return field;
      });
      const menuField = (await wObjectHelper.processWobjects({
        locale: data.locale,
        fields: [FIELDS_NAMES.MENU_ITEM],
        wobjects: [clonedObject],
        returnArray: false,
        app,
      }))[FIELDS_NAMES.MENU_ITEM];
      if (!menuField) break;

      let { result: obj } = await Wobj.findOne(menuField);
      obj = await prepareObject({
        fields: wobject.fields, app, data, user, object: obj, permlink: wobject.author_permlink,
      });
      wobjects.push(obj);
      break;

    case 'listItems':
      const fields = (await wObjectHelper.processWobjects({
        locale: data.locale,
        fields: [FIELDS_NAMES.LIST_ITEM],
        wobjects: [_.cloneDeep(wobject)],
        returnArray: false,
        app,
      }))[FIELDS_NAMES.LIST_ITEM];
      if (!fields) return { wobjects: [] };
      ({ result: wobjects } = await Wobj.find({ author_permlink: { $in: _.map(fields, 'body') } }));

      wobjects = await Promise.all(wobjects.map(async (wobj) => {
        wobj = await prepareObject({
          fields, app, data, user, object: wobj, permlink: wobj.author_permlink,
        });
        return wobj;
      }));
      break;
  }
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
    const { wobjects } = await getListItems(wObject, data, app, keyName);
    if (wobjects && wobjects.length) wObject[keyName] = wobjects;
  }

  return { wobjectData: wObject };
};

module.exports = {
  getOne,
};
