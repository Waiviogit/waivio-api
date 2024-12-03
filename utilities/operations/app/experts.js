const _ = require('lodash');
const { App, UserExpertiseModel } = require('models');
const asyncLocalStorage = require('../../../middlewares/context/context');

exports.collect = async ({ limit }) => {
  // eslint-disable-next-line camelcase
  const { apps, error } = await App.getAll();

  if (error) return { error };
  const res = await Promise.all(apps.map(async (app) => {
    if (!app.supported_objects || !app.supported_objects.length) return { [app.name]: 'empty' };
    const { result, error: aggregateError } = await UserExpertiseModel.aggregate([
      { $match: { author_permlink: { $in: app.supported_objects } } },
      { $group: { _id: '$user_name', weight: { $sum: '$weight' } } },
      { $sort: { weight: -1 } },
      { $limit: limit },
      { $project: { _id: 0, name: '$_id', weight: 1 } },
    ]);

    if (aggregateError) return { [app.name]: 'aggregation error' };
    const { result: updResult, error: updError } = await App.updateOne(
      { name: app.name, updData: { $set: { top_users: result } } },
    );
    if (updError) return { [app.name]: 'update error' };
    return { [app.name]: updResult };
  }));
  return res;
};

exports.get = async ({ skip, limit }) => {
  const store = asyncLocalStorage.getStore();
  const host = store.get('host');
  const { result: app, error } = await App.findOne({ host });

  if (error || !app) return { error: error || { status: 404, message: 'App not found!' } };
  return { users: _.slice(app.top_users, skip, limit + skip) };
};
