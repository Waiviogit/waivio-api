const moment = require('moment');
const _ = require('lodash');
const { importUser } = require('./importSteemUserOps');
const { redisGetter, redisSetter } = require('../../redis');
const { MAX_IMPORTING_USERS } = require('../../../constants/common');
const { User } = require('../../../models');

/**
 * Validate current importing users state, check for already importing specified user
 * and if all valid - start import
 * @param userName {String}
 * @returns {Promise<{error: (Object)}|{result: {ok: boolean}}>}
 * result {ok:true} on success or error
 */
exports.startImportUser = async (userName) => {
  if (!(await validateCountImporting())) {
    return {
      error: {
        message: 'Max number of users are importing at the moment! Try again later.',
        status: 503,
      },
    };
  }

  if (!(await validateForExistingImportedUser(userName))) {
    return {
      error: {
        message: `User ${userName} is being imported!`,
        status: 423,
      },
    };
  }

  if (!(await validateAlreadyImportedUser(userName))) {
    return {
      error: {
        message: `User ${userName} is already imported!`,
        status: 400,
      },
    };
  }

  await redisSetter.addImportedUser(userName);
  runImport(userName);
  return { result: { ok: true } };
};

exports.importUsersTask = async (getUsersKeysFromRedis, getUserDataFromRedis) => {
  const users = await getUsersKeysFromRedis();
  if (users && users.length) {
    for (const user of users) {
      const userName = user.split(':')[1];
      const addingDate = await getUserDataFromRedis(userName);
      if (user.split(':')[0] === 'import_user_error' || moment.utc().subtract(15, 'minute') > moment.utc(addingDate)) {
        await runImport(userName);
      }
    }
  }
};

const runImport = async (userName) => {
  const { error } = await importUser(userName);
  await redisSetter.deleteKey({ key: `import_user:${userName}` });
  if (!error) return;

  const alreadyErrored = await redisGetter.getErroredUser(userName);
  if (alreadyErrored) {
    await redisSetter.deleteKey({ key: `import_user_error:${userName}` });
    return;
  }

  await redisSetter.setImportedUserError(userName, JSON.stringify(error));
};

/**
 * Return true if count of currently importing users are valid
 * (zero or less than MAX_IMPORTING_USERS)
 * @returns {Promise<boolean>} true if OK
 */
const validateCountImporting = async () => {
  const users = await redisGetter.getAllImportedUsers();

  return !users || _.isEmpty(users) || users.length < MAX_IMPORTING_USERS;
};

/**
 * Return true if specified user isn't importing at the moment
 * @returns {Promise<boolean>} true if OK
 */
const validateForExistingImportedUser = async (userName) => {
  const user = await redisGetter.getImportedUser(userName);

  return !user;
};

/**
 * Return true if user already imported with STEEM info
 * @param userName {String}
 * @returns {Promise<boolean>} true if OK
 */
const validateAlreadyImportedUser = async (userName) => {
  const { user, error } = await User.getOne(userName);
  return _.get(user, 'stage_version') !== 1;
};
