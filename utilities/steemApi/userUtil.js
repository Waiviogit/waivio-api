const { client, clientAnyx } = require('utilities/steemApi/steem');

exports.getAccount = async (name) => {
  try {
    const [account] = await client.database.getAccounts([name]);

    if (!account) {
      return { error: { status: 404, message: 'User not found!' } };
    }
    return { userData: account };
  } catch (error) {
    return { error };
  }
};

exports.getFollowingsList = async ({ name, startAccount, limit }) => {
  try {
    const followings = await client.call(
      'follow_api',
      'get_following',
      [name, startAccount, 'blog', limit],
    );

    return { followings };
  } catch (error) {
    return { error };
  }
};

// return {account: 'accname', follower_count: 000, following_count: 000}
exports.getFollowCount = async (name) => {
  try {
    const result = await clientAnyx.call(
      'condenser_api',
      'get_follow_count',
      [name],
    );
    if (result && result.error) return { error: result.error };
    return { result };
  } catch (error) {
    return { error };
  }
};

exports.searchUserByName = async (name, limit = 20) => {
  try {
    const accounts = await clientAnyx.call('condenser_api', 'get_account_reputations', [name, limit]);

    return { accounts };
  } catch (e) {
    return { error: e };
  }
};
