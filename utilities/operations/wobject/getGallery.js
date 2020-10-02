const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const { App, Wobj } = require('models');
const wObjectHelper = require('utilities/helpers/wObjectHelper');

module.exports = async (data) => {
  const { wObject, error } = await Wobj.getOne(data.authorPermlink);
  if (error) return { error };
  const session = getNamespace('request-session');
  const host = session.get('host');
  const { result: app } = await App.findOne({ host });
  const { galleryAlbum } = await wObjectHelper.processWobjects({
    fields: ['galleryAlbum', 'galleryItem'],
    app,
    locale: data.locale,
    wobjects: [_.cloneDeep(wObject)],
    returnArray: false,
  });
  return { result: galleryAlbum || [] };
};
