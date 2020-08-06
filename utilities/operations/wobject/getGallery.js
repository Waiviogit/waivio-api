const _ = require('lodash');
const { App, Wobj } = require('models');
const wObjectHelper = require('utilities/helpers/wObjectHelper');

module.exports = async (data) => {
  const { wObject, error } = await Wobj.getOne(data.authorPermlink);
  if (error) return { error };
  const { app } = await App.getOne({ name: data.app });
  const { galleryAlbum } = await wObjectHelper.processWobjects({
    fields: ['galleryAlbum', 'galleryItem'],
    admins: _.get(app, 'admins', []),
    locale: data.locale,
    wobjects: [_.cloneDeep(wObject)],
    returnArray: false,
  });
  return { result: galleryAlbum || [] };
};
