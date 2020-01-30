const _ = require('lodash');
const { Wobj } = require('models');
const { REQUIREDFIELDS, REQUIREFIELDS_PARENT } = require('utilities/constants');

const getOne = async (data) => { // get one wobject by author_permlink
  const { wObject, error: getWobjError } = await Wobj.getOne(data.author_permlink);

  if (getWobjError) return { error: getWobjError };

  // format parent field
  if (Array.isArray(wObject.parent)) {
    if (_.isEmpty(wObject.parent)) {
      wObject.parent = '';
    } else {
      // eslint-disable-next-line prefer-destructuring
      wObject.parent = wObject.parent[0];
      getRequiredFields(wObject.parent, REQUIREFIELDS_PARENT);
    }
  }
  const requiredFields = [...REQUIREDFIELDS];

  // format listItems field
  if (await Wobj.isFieldExist({ author_permlink: data.author_permlink, fieldName: 'listItem' })) {
    const { wobjects, sortCustom, error: listError } = await Wobj.getList(data.author_permlink);

    if (listError) console.error(listError);

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
  if (data.required_fields && ((Array.isArray(data.required_fields)
      && data.required_fields.length
      && data.required_fields.every(_.isString)) || _.isString(data.required_fields))) {
    if (_.isString(data.required_fields)) requiredFields.push(data.required_fields);
    else requiredFields.push(...data.required_fields);
  }

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

module.exports = {
  getOne,
};
