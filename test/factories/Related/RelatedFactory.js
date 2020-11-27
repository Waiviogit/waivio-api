const { RelatedAlbum, faker } = require('test/testHelper');

const Create = async ({
  wobjAuthorPermlink, postAuthorPermlink, images, onlyData,
} = {}) => {
  const imageData = {
    wobjAuthorPermlink: wobjAuthorPermlink || faker.random.string(),
    postAuthorPermlink: postAuthorPermlink || faker.random.string(),
    images: images || [faker.random.string()],
  };
  if (onlyData) return imageData;
  const image = new RelatedAlbum(imageData);
  await image.save();
  image.toObject();

  return image;
};

module.exports = { Create };
