const _ = require('lodash');
const { App, User } = require('../../../models');

exports.getSiteAuthorities = async (params, path) => {
  const { result, error } = await App.findOne({ host: params.host, owner: params.userName });
  if (error) return { error };
  if (!result) return { error: { status: 404, message: 'Site dont find!' } };
  let condition = {};
  switch (path) {
    case 'moderators':
      condition = { name: { $in: result.moderators } };
      break;
    case 'administrators':
      condition = { name: { $in: result.admins } };
      break;
    case 'authorities':
      condition = { name: { $in: result.authority } };
      break;
  }
  const { result: users, error: usersError } = await User.findWithSelect(condition, {
    name: 1, alias: 1, posting_json_metadata: 1, json_metadata: 1, wobjects_weight: 1,
  });
  if (usersError) return { error: usersError };

  if (!_.isEmpty(users)) {
    users.sort((a, b) => condition.name.$in.indexOf(b.name) - condition.name.$in.indexOf(a.name));
  }

  return { result: users };
};
