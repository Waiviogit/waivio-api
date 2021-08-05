const _ = require('lodash');
const image = require('utilities/images/image');
const { Prefetch } = require('database').models;
const { base64ByUrl, generateFileName } = require('utilities/helpers/imagesHelper');

const findOne = async (condition, select) => {
  try {
    return {
      result: await Prefetch.findOne(condition, select).lean(),
    };
  } catch (error) {
    return { error };
  }
};

const find = async (condition, select, sort = {}, skip = 0, limit) => {
  try {
    return {
      result: await Prefetch
        .find(condition, select)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

const create = async (data) => {
  try {
    if (data.image) {
      const { imageUrl, error } = await image.uploadInS3(await base64ByUrl(data.image), await generateFileName({}));
      data.image = imageUrl;
      if (error) return console.log('Error download image to S3', error);
    }
    const prefetch = await new Prefetch({
      name: _.get(data, 'name'),
      category: _.get(data, 'category'),
      route: _.get(data, 'route'),
      image: _.get(data, 'image'),
    }).save();
    return { result: prefetch.toObject() };
  } catch (error) {
    return { error };
  }
};

const isExists = async ({ names }) => {
  const prefetchesCount = await Prefetch.countDocuments({ name: { $in: names } });
  return !(prefetchesCount < names.length);
};

module.exports = {
  findOne, find, create, isExists,
};
