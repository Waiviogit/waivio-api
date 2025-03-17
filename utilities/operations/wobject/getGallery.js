const _ = require('lodash');
const {
  App,
  Wobj,
} = require('../../../models');
const wObjectHelper = require('../../helpers/wObjectHelper');
const asyncLocalStorage = require('../../../middlewares/context/context');

module.exports = async (data) => {
  const {
    wObject,
    error,
  } = await Wobj.getOne(data.authorPermlink);
  if (error) return { error };
  const store = asyncLocalStorage.getStore();
  const host = store.get('host');
  const { result: app } = await App.findOne({ host });
  const processedObject = await wObjectHelper.processWobjects({
    app,
    locale: data.locale,
    wobjects: [_.cloneDeep(wObject)],
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
      wObjectHelper.findFieldByBody(wObject.fields, processedObject.avatar)
      ?? { weight: 1, body: processedObject.avatar },
      ...photoWithoutAlbum,
    );
  }
  if (!defaultPhotosAlbum) {
    const photoWithoutAlbum = _.filter(
      _.get(processedObject, 'galleryItem', []),
      (g) => !_.includes(albumsId, g.id),
    );

    const album = { items: photoWithoutAlbum, body: 'Photos', id: data.authorPermlink };

    if (processedObject.avatar) {
      album.items.push(
        wObjectHelper.findFieldByBody(wObject.fields, processedObject.avatar)
        ?? { weight: 1, body: processedObject.avatar },
      );
    }
    processedObject.galleryAlbum
      ? processedObject.galleryAlbum.push(album)
      : processedObject.galleryAlbum = [album];
  }

  return { result: processedObject.galleryAlbum || [] };
};
