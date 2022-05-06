const _ = require('lodash');
const { getAccountHistory } = require('../../hiveApi/userUtil');
const { USER_OPERATIONS, USER_IDENTIFIERS, USER_OPERATIONS_TYPES } = require('../../../constants/usersData');

exports.getUserLastActivity = async (name) => {
  if (!name) return { error: { status: 404, message: 'Not Found' } };

  const { result, error } = await getAccountHistory(name, -1, 1000);
  if (error) return { error };

  if (!result || _.isEmpty(result)) {
    return { status: 404, message: `Activity of user ${name} not found!` };
  }

  result.reverse();
  return { lastActivity: findLastActivity(_.map(result, (el) => el[1]), name) };
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
