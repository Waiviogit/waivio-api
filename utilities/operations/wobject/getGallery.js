const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const {
  App,
  Wobj,
} = require('models');
const wObjectHelper = require('utilities/helpers/wObjectHelper');

const findFieldByBody = (fields, body) => _.find(fields, (f) => f.body === body);

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

    const avatarField = findFieldByBody(wObject.fields, processedObject.avatar);

    defaultPhotosAlbum.items.push(
      { weight: 1, body: processedObject.avatar, creator: avatarField?.creator ?? '' },
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
      const avatarField = findFieldByBody(wObject.fields, processedObject.avatar);
      album.items.push({ weight: 1, body: processedObject.avatar, creator: avatarField?.creator ?? '' });
    }
    processedObject.galleryAlbum
      ? processedObject.galleryAlbum.push(album)
      : processedObject.galleryAlbum = [album];
  }

  return { result: processedObject.galleryAlbum || [] };
};
