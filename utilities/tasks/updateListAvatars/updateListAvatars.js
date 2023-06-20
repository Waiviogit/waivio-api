const { base64ByUrl } = require('utilities/helpers/imagesHelper');
const image = require('utilities/images/image');
const AWS = require('aws-sdk');
const { AWSS3_IMAGE_PARAMS } = require('constants/common');
const util = require('util');
const { WObject } = require('database').models;

const extractIdFromUrl = (url) => {
  const regex = /\/(\d{10}_[-\w]+)$/;
  const matches = url.match(regex);

  if (matches && matches.length > 1) {
    return matches[1];
  }

  return null;
};

const updateAllImages = async () => {
  const spacesEndpoint = new AWS.Endpoint(process.env.AWS_ENDPOINT);

  const _s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    params: AWSS3_IMAGE_PARAMS,
  });
  const listObjectsV2Async = util.promisify(_s3.listObjectsV2.bind(_s3));
  const listObjectsAsync = async (StartAfter = '') => {
    try {
      const data = await listObjectsV2Async({ StartAfter });
      return { result: data?.Contents ?? [] };
    } catch (error) {
      return { error };
    }
  };

  let result = [];
  let startAfter = '';
  do {
    ({ result } = await listObjectsAsync(startAfter));
    startAfter = result[result.length - 1]?.Key;
    for (const resultElement of result) {
      const imageUrl = `https://waivio.nyc3.digitaloceanspaces.com/${resultElement?.Key}`;
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
  } while (startAfter);

  console.log('task finished');
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
