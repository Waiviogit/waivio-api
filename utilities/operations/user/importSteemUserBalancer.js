const _ = require('lodash');
const { importUser } = require('./importSteemUserOps');
const { redisGetter, redisSetter } = require('../../redis');
const { MAX_IMPORTING_USERS } = require('../../constants');

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
        message: `User ${userName} is importing at the moment!`,
        status: 423,
      },
    };
  }
  await redisSetter.addImportedUser(userName);
  runImport(userName);
  return { result: { ok: true } };
};

const runImport = async (userName) => {
  const { user, error } = await importUser(userName);

  if (error) {
    console.error(error);
    await redisSetter.setImportedUserError(userName, JSON.stringify(error));
  } else if (user) {
    console.log(`User ${userName} successfully imported with STEEM info!`);
  }
  redisSetter.deleteImportedUser(userName);
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
 * Return true if specified user is importing at the moment
 * @returns {Promise<boolean>} true if OK
 */
const validateForExistingImportedUser = async (userName) => {
  const user = await redisGetter.getImportedUser(userName);

  return !user;
};
