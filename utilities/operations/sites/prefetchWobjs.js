const searchHelper = require('utilities/helpers/searchHelper');
const { App, PrefetchModel } = require('models');

exports.showAllPrefs = async (data) => {
  const { result, error } = await PrefetchModel.find({ type: data.type });
  if (error || !result) return { error };
  return { result };
};

exports.getPrefsList = async (data) => {
  const appInfo = await searchHelper.getAppInfo({});
  const { result, error } = await PrefetchModel.find(
    { name: { $in: appInfo.prefetches }, type: data.type },
  );
  if (error || !result) return { error };
  return { result };
};

exports.updatePrefsList = async (prefetches) => {
  if (!await PrefetchModel.isExists({ ...prefetches })) {
    return { error: { status: 404, message: 'Prefetches not found!' } };
  }
  const { app } = await searchHelper.getAppInfo({});
  const { result } = await App.findOneAndUpdate(
    { name: app.name }, { prefetches: prefetches.names },
  );
  return { result: result.prefetches };
};

exports.createPref = async (data) => {
  const { result: prefetch } = await PrefetchModel.findOne({ name: data.name });
  if (prefetch) return { result: prefetch };
  const { result, error } = await PrefetchModel.create(data);
  if (error || !result) return { error };
  return { result };
};
