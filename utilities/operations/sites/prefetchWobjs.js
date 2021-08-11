const searchHelper = require('utilities/helpers/searchHelper');
const { App, PrefetchModel } = require('models');

exports.showAllPrefetches = async (data) => {
  const { result, error } = await PrefetchModel.find({ condition: { type: data.type }, ...data });
  if (error || !result) return { error };
  return { result };
};

exports.getPrefetchList = async (data) => {
  const appInfo = await searchHelper.getAppInfo({});
  const { result, error } = await PrefetchModel.find({
    condition: { name: { $in: appInfo.prefetches }, type: data.type }, ...data,
  });
  if (error || !result) return { error };
  return { result };
};

exports.updatePrefetchList = async (prefetches) => {
  if (!await PrefetchModel.isExists({ ...prefetches })) {
    return { error: { status: 404, message: 'Prefetches not found!' } };
  }
  const { app } = await searchHelper.getAppInfo({});
  const { result } = await App.findOneAndUpdate(
    { host: app.host }, { prefetches: prefetches.names },
  );
  return { result: { names: result.prefetches } };
};

exports.createPrefetch = async (data) => {
  const { result: prefetch } = await PrefetchModel.findOne({ name: data.name });
  if (prefetch) return { result: prefetch };
  const { result, error } = await PrefetchModel.create(data);
  if (error || !result) return { error };
  return { result };
};
