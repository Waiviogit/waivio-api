const { searchHelper, prefetchHelper } = require('../../helpers');
const { App, PrefetchModel } = require('../../../models');
const _ = require('lodash');

exports.showAllPrefetches = async (data) => {
  const { result, error } = await PrefetchModel.find({
    condition: { type: { $in: _.get(data, 'types') } }, ...data,
  });
  if (error || !result) return { error };
  return { result };
};

exports.getPrefetchList = async (data) => {
  const appInfo = await searchHelper.getAppInfo({});
  const { result, error } = await PrefetchModel.find({
    condition: { name: { $in: appInfo.prefetches }, type: { $in: _.get(data, 'types') } },
    ...data,
  });
  if (error || !result) return { error };
  return { result };
};

exports.updatePrefetchList = async (data) => {
  if (!await PrefetchModel.isExists({ names: data.names })) {
    return { error: { status: 404, message: 'Prefetches not found!' } };
  }
  const { app } = await searchHelper.getAppInfo({});

  if (!_.includes([app.owner, ...app.admins, ...app.moderators], data.userName)) {
    return { error: { status: 403, message: 'Access denied' } };
  }
  const { result } = await App.findOneAndUpdate(
    { host: app.host }, { prefetches: data.names },
  );
  return { result: { names: result.prefetches } };
};

exports.createPrefetch = async (data) => {
  const { result: prefetch } = await PrefetchModel.findOne({ name: data.name });
  if (prefetch) return { result: prefetch };

  if (data.image) data.image = await prefetchHelper.parseImage(data);
  data.route = prefetchHelper.createRoute(data);
  const { result, error } = await PrefetchModel.create(data);
  if (error || !result) return { error };
  return { result };
};
