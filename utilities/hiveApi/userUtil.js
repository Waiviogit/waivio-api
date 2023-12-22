const _ = require('lodash');
const {
  getHistoryClient,
  getRegularClient,
} = require('./clientOptions');

exports.getAccount = async (name) => {
  try {
    // const client = await getRegularClient();
    // const [account] = await client.database.getAccounts([name]);
    //
    // if (!account) {
    //   return { error: { status: 404, message: 'User not found!' } };
    // }
    // return { userData: account };
    return { userData: {} };
  } catch (error) {
    return { error };
  }
};

exports.getFollowingsList = async ({ name, startAccount, limit }) => {
  try {
    // const client = await getRegularClient();
    // const followings = await client.call(
    //   'condenser_api',
    //   'get_following',
    //   [name, startAccount, 'blog', limit],
    // );

    return { followings: [] };
  } catch (error) {
    return { error };
  }
};

exports.getFollowersList = async ({ name, startAccount, limit }) => {
  try {
    // const client = await getRegularClient();
    // const followers = await client.call(
    //   'condenser_api',
    //   'get_followers',
    //   [name, startAccount, 'blog', limit],
    // );
    return { followers: [] };
  } catch (error) {
    return { error };
  }
};

exports.getFollowCount = async (name) => {
  try {
    // const client = await getRegularClient();
    // const result = await client.call(
    //   'condenser_api',
    //   'get_follow_count',
    //   [name],
    // );
    // if (result && result.error) return { error: result.error };
    return { result: {} };
  } catch (error) {
    return { error };
  }
};

exports.searchUserByName = async ({ name, limit = 20 }) => {
  try {
    // const client = await getRegularClient();
    // const accounts = await client.call('condenser_api', 'get_account_reputations', [name, limit]);

    return { accounts: [] };
  } catch (error) {
    return { error };
  }
};

exports.getDelegations = async (account, cb = (el) => _.get(el, 'delegations', [])) => {
  try {
    // const client = await getRegularClient();
    // const result = await client.call(
    //   'database_api',
    //   'find_vesting_delegations',
    //   { account },
    // );
    let result;
    if (!result) return { error: { status: 404, message: 'Not Found' } };
    return cb(result);
  } catch (error) {
    return { error };
  }
};

exports.getDelegationExpirations = async (account, cb = (el) => _.get(el, 'delegations', [])) => {
  try {
    // const client = await getRegularClient();
    // const result = await client.call(
    //   'database_api',
    //   'find_vesting_delegation_expirations',
    //   { account },
    // );
    let result;
    if (!result) return { error: { status: 404, message: 'Not Found' } };
    return cb(result);
  } catch (error) {
    return { error };
  }
};

exports.getAccountHistory = async (name, id, limit) => {
  try {
    // const client = await getHistoryClient();
    // const hiveResp = await client.database.getAccountHistory(
    //   name,
    //   id,
    //   limit,
    // );

    return { result: [] };


  } catch (error) {
    return { error };
  }
};
