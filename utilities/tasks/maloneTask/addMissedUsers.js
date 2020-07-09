const _ = require('lodash');
const { User } = require('database').models;
const { importUser } = require('utilities/operations/user/importSteemUserOps');
const axios = require('axios');

exports.add = async () => {
  const users = await User.find({ followers_count: { $gt: 5000 } }).lean();

  const batchSize = 1000;
  let currBatchSize = 0;
  let startAccount = '';
  for (const usr of users) {
    do {
      const { followers, error } = await anyxRequest({
        start: startAccount, limit: batchSize, name: usr.name,
      });

      if (error || !followers) {
        console.error(error || `Followers for ${usr.name} not found`);
        return { error };
      }
      currBatchSize = followers.length;
      startAccount = _.get(users, `[${batchSize - 1}].name`, '');
      for (const follower of followers) {
        const user = await User.findOne({ name: follower.follower });
        if (user) continue;
        const { user: update, error: err } = await importUser(follower.follower);
        if (update) console.log(`user ${follower.follower} successfully updated`);
        if (err) console.error(err.message);
      }
    } while (currBatchSize === batchSize);
  }
};

const anyxRequest = async ({ name, start, limit }) => {
  try {
    const result = await axios.post('https://anyx.io', {
      jsonrpc: '2.0',
      method: 'call',
      params: [
        'follow_api',
        'get_followers',
        [name, start, 'blog', limit],
      ],
    });
    return { followers: result.data.result };
  } catch (error) {
    return { error };
  }
};
