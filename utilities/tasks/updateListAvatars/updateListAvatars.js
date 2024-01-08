const { base64ByUrl } = require('utilities/helpers/imagesHelper');
const image = require('utilities/images/image');
const { WObject } = require('database').models;

const extractIdFromUrl = (url) => {
  const regex = /\/(\d{10}_[-\w]+)$/;
  const matches = url.match(regex);

  if (matches && matches.length > 1) {
    return matches[1];
  }

  return null;
};

const updateListAvatars = async () => {
  const wobjects = await WObject.aggregate([
    { $match: { 'fields.name': 'avatar', object_type: 'list' } },
    { $unwind: '$fields' },
    { $match: { 'fields.name': 'avatar' } },
    {
      $project: {
        image: '$fields.body',
      },
    },
  ]);

  for (const wobject of wobjects) {
    const imageUrl = wobject?.image;
    if (!imageUrl) continue;
    const imageId = extractIdFromUrl(imageUrl);
    if (!imageId) {
      console.log(imageUrl, 'error');
      continue;
    }

    const buffer = await base64ByUrl(imageUrl);
    if (!buffer) {
      console.log(imageUrl, 'buffer error');
    }

    await image.uploadInS3(buffer, imageId);
    console.log(imageUrl, 'updated');
  }

  console.log('task finished');
};

module.exports = updateListAvatars;
