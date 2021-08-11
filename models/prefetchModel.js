const _ = require('lodash');
const { Prefetch } = require('database').models;
const prefetchHelper = require('utilities/helpers/prefetchHelper');

const findOne = async (condition, select) => {
  try {
    return {
      result: await Prefetch.findOne(condition, select).lean(),
    };
  } catch (error) {
    return { error };
  }
};

const find = async ({
  condition, select, sort = {}, skip = 0, limit = 100,
}) => {
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
    if (data.image) data.image = await prefetchHelper.parseImage(data);
    const prefetch = await new Prefetch({
      name: _.get(data, 'name'),
      tag: _.get(data, 'tag'),
      type: _.get(data, 'type'),
      category: _.get(data, 'category'),
      route: prefetchHelper.createRoute(data),
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
