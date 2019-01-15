const {Wobj} = require('../../models');

const getGallery =  async function ({author_permlink}) {
    const {galleryItems, galleryAlbums} = await Wobj.getGalleryItems({author_permlink});
    if (!galleryAlbums) {
        return {galleryAlbums: []}
    }
    galleryAlbums.forEach(album => {
        album.items = galleryItems.filter(item => item.id === album.id);
    });
    return {galleryAlbums}
};

module.exports = {getGallery}