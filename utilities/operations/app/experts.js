const _ = require('lodash');
const { App, UserWobjects } = require('models');

const getAppWobjects = async ({ name }) => {
  const { app, error } = await App.getOne({ name });

  if (error) return { error };
  return { supported_objects: _.get(app, 'supported_objects') || [] };
};

module.exports = async ({ name, skip, limit }) => {
  // eslint-disable-next-line camelcase
  const { supported_objects, error } = await getAppWobjects({ name });

  if (error) return { error };
  const { result, error: aggregateError } = await UserWobjects.aggregate([
    { $match: { author_permlink: { $in: supported_objects } } },
    { $group: { _id: '$user_name', weight: { $sum: '$weight' } } },
    { $sort: { weight: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _id: 0, name: '$_id', weight: 1 } },
  ]);

  if (aggregateError) return { error: aggregateError };
  return { users: result };
};
