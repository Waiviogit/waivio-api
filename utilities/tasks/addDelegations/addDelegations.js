const { User, Delegation } = require('database').models;

const userUtil = require('utilities/hiveApi/userUtil');

module.exports = async () => {
  try {
    const users = User.find({}, { name: 1 }).lean();
    // find one is first user after it write id to redis and take butch 100
    // add stopper redis if import already completed
    // add id to redis
    // get butch 1000 {_id: {$gte: 'our last id'} and if result < 1000 add stopper to redis

    for await (const user of users) {
      const delegations = await userUtil.getDelegations(user.name);
      if (delegations?.error) {
        console.log('error get delegations for ', user.name);
        continue;
      }
      if (!delegations.length) continue;

      const bulkOps = delegations.map((delegation) => ({
        insertOne: {
          document: {
            delegator: delegation.delegator,
            delegatee: delegation.delegatee,
            vesting_shares: +delegation.vesting_shares.amount,
            delegation_date: delegation.min_delegation_time,
          },
        },
      }));
      await Delegation.bulkWrite(bulkOps);
    }

    console.log('task completed');
  } catch (error) {
    console.log(error.message);
  }
};
