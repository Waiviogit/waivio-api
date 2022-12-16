const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const {
  App,
  Wobj,
} = require('models');
const wObjectHelper = require('utilities/helpers/wObjectHelper');

module.exports = async (data) => {
  const {
    wObject,
    error,
  } = await Wobj.getOne(data.authorPermlink);
  if (error) return { error };
  const session = getNamespace('request-session');
  const host = session.get('host');
  const { result: app } = await App.findOne({ host });
  const processedObject = await wObjectHelper.processWobjects({
    app,
    locale: data.locale,
    wobjects: [wObject],
    returnArray: false,
  });
  const defaultPhotosAlbum = _.find(processedObject.galleryAlbum, (a) => a.body === 'Photos');
  const albumsId = _.map(processedObject.galleryAlbum, (a) => a.id);
  if (defaultPhotosAlbum && processedObject.avatar) {
    const photoWithoutAlbum = _.filter(
      _.get(processedObject, 'galleryItem', []),
      (g) => !_.includes(albumsId, g.id),
    );

    defaultPhotosAlbum.items.push(
      { weight: 1, body: processedObject.avatar },
      ...photoWithoutAlbum,
    );
  }
  if (!defaultPhotosAlbum) {
    const album = { items: [], body: 'Photos', id: data.authorPermlink };
    processedObject.avatar && album.items.push({ weight: 1, body: processedObject.avatar });
    processedObject.galleryAlbum
      ? processedObject.galleryAlbum.push(album)
      : processedObject.galleryAlbum = [album];
  }

  return { result: processedObject.galleryAlbum || [] };
};
