const _ = require('lodash');
const { User } = require('models');
const { getAccountHistory } = require('../../hiveApi/userUtil');
const { USER_OPERATIONS, USER_IDENTIFIERS, USER_OPERATIONS_TYPES } = require('../../../constants/usersData');

const updateLastActivity = async ({ name, creationDate }) => {
  const { result, error } = await getAccountHistory(name, -1, 1000);
  if (error) return { error };

  if (!result || !result.length) {
    await User.updateOne({ name }, { lastActivity: creationDate });
    return;
  }
  result.reverse();

  const lastActivity = findLastActivity(_.map(result, (el) => el[1]), name);

  await User.updateOne({ name }, { lastActivity: new Date(lastActivity) });
};

exports.getUserLastActivity = async (name) => {
  if (!name) return { error: { status: 404, message: 'Not Found' } };

  const { user } = await User.getOne(name, { lastActivity: 1, createdAt: 1 });

  if (!user) {
    return { error: { status: 404, message: 'Not Found' } };
  }
  if (user.lastActivity) {
    return { lastActivity: new Date(user.lastActivity).toISOString().slice(0, 19) };
  }
  const creationDate = new Date(user.createdAt).toISOString().slice(0, 19);

  updateLastActivity({ name, creationDate });

  return { lastActivity: creationDate };
};

const findLastActivity = (data, name) => {
  if (data.length === 1) return _.get(data[0], 'timestamp');

  const operation = _.find(data, (el) => _.includes(USER_OPERATIONS, el.op[0])
      && ((el.op[0] === USER_OPERATIONS_TYPES.VOTE && el.op[1].hasOwnProperty(USER_IDENTIFIERS.VOTER) && el.op[1].voter === name)
          || (el.op[1].hasOwnProperty(USER_IDENTIFIERS.FROM) && el.op[1].from === name)
          || (el.op[0] === USER_OPERATIONS_TYPES.CUSTOM_JSON)
          || (el.op[0] === USER_OPERATIONS_TYPES.COMMENT && el.op[1].hasOwnProperty(USER_IDENTIFIERS.AUTHOR) && el.op[1].author === name)));
  if (operation) return _.get(operation, 'timestamp');
};
