const {
  getCacheKey,
  getCachedData,
  setCachedData,
} = require('../utilities/helpers/cacheHelper');
const jsonHelper = require('../utilities/helpers/jsonHelper');
const { TTL_TIME } = require('../constants/common');
const { App } = require('database').models;

const getOne = async ({ host, bots }) => {
  try {
    const app = await App.findOne({ host }).select({ service_bots: bots ? 1 : 0 }).lean();

    if (!app) {
      return { error: { status: 404, message: 'App not found!' } };
    }
    return { app };
  } catch (error) {
    return { error };
  }
};

const getAll = async () => {
  try {
    const apps = await App.find().lean();

    if (!apps || !apps.length) {
      return { error: { status: 404, message: 'App not found!' } };
    }
    return { apps };
  } catch (error) {
    return { error };
  }
};

const aggregate = async (pipeline) => {
  try {
    const result = await App.aggregate(pipeline);

    if (!result) {
      return { error: { status: 404, message: 'Not found!' } };
    }
    return { result };
  } catch (error) {
    return { error };
  }
};

const updateOne = async ({ name, updData }) => {
  try {
    const result = await App.updateOne({ name }, updData);
    return { result: !!result.nModified };
  } catch (error) {
    return { error };
  }
};

const updateMany = async (condition, updateData) => {
  try {
    const result = await App.updateMany(condition, updateData);
    return { result: result.nModified };
  } catch (error) {
    return { error };
  }
};

const findOneAndUpdate = async (condition, updateData) => {
  try {
    return { result: await App.findOneAndUpdate(condition, updateData, { new: true }).lean() };
  } catch (error) {
    return { error };
  }
};

const findOne = async (condition, select = {}) => {
  try {
    return { result: await App.findOne(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

const find = async (condition, sort = {}, select = {}) => {
  try {
    return { result: await App.find(condition, select).sort(sort).lean() };
  } catch (error) {
    return { error };
  }
};

const findWithPopulate = async ({ condition, populate }) => {
  try {
    return { result: await App.find(condition).populate(populate).lean() };
  } catch (error) {
    return { error };
  }
};

const create = async (condition) => {
  const app = new App(condition);
  try {
    return { result: await app.save() };
  } catch (error) {
    return { error };
  }
};

const getAppFromCache = async (host) => {
  const key = getCacheKey({ getAppFromCache: host });
  const cache = await getCachedData(key);
  if (cache) {
    return jsonHelper.parseJson(cache, null);
  }

  const { result } = await findOne({ host });

  await setCachedData({
    key, data: result, ttl: TTL_TIME.ONE_MINUTE,
  });

  return result;
};

const findOneCanonicalByOwner = async ({ owner }) => {
  try {
    const result = await App.findOne(
      {
        owner,
        useForCanonical: true,
      },
      { host: 1, status: 1 },
      { sort: { createdAt: 1 } },
    )
      .lean();
    if (result) return { result };

    const oldestActive = await App.findOne(
      {
        owner,
        status: 'active',
      },
      { host: 1, status: 1 },
      { sort: { createdAt: 1 } },
    )
      .lean();

    return {
      result: oldestActive,
    };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  getOne,
  aggregate,
  updateOne,
  updateMany,
  getAll,
  findOne,
  find,
  create,
  findWithPopulate,
  findOneAndUpdate,
  getAppFromCache,
  findOneCanonicalByOwner,
};
