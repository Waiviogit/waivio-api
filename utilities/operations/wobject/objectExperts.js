const { UserWobjects, User, Wobj } = require('models');
const _ = require('lodash');

const getWobjExperts = async ({
  // eslint-disable-next-line camelcase
  author_permlink, skip = 0, limit = 30, user,
}) => {
  let userExpert;

  const { result: wobj, error: wobjErr } = await Wobj.findOne(author_permlink);
  if (wobjErr || !wobj) return { error: wobjErr || { status: 404, message: 'Wobject not found!' } };

  if (user) {
    const { experts, error } = await UserWobjects.getByWobject({
      authorPermlink: author_permlink, username: user,
    });
    if (error) return { error };
    userExpert = _.get(experts, '[0]');
  }
  const { experts, error } = await UserWobjects.getByWobject({
    authorPermlink: author_permlink, skip, limit, weight: true,
  });
  if (error) return { error };
  const { result, error: getFollowersErr } = await getFollowersCount({ experts, userExpert });
  if (getFollowersErr) return { error: getFollowersErr };
  return { experts: result, userExpert };
};

const getFollowersCount = async ({ experts, userExpert }) => {
  const { usersData, error } = await User.find({
    condition: { name: { $in: _.compact([..._.map(experts, 'name'), _.get(userExpert, 'name')]) } },
    select: { name: 1, followers_count: 1 },
  });
  if (error) return { error };
  if (userExpert) {
    const expert = _.find(usersData, (el) => el.name === userExpert.name);
    userExpert.followers_count = _.get(expert, 'followers_count', 0);
  }
  return {
    result: _.forEach(experts, (el) => {
      const user = _.find(usersData, (obj) => obj.name === el.name);
      el.followers_count = _.get(user, 'followers_count', 0);
    }),
  };
};

module.exports = { getWobjExperts };
