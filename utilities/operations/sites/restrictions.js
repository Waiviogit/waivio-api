const _ = require('lodash');
const { mutedUserModel, blacklistModel, User } = require('models');

exports.get = async ({ app }) => {
  if (!app) return { result: {} };
  const { result: muted } = await mutedUserModel.find({ condition: { mutedForApps: _.get(app, 'host') }, sort: { _id: -1 } });
  const { blackLists } = await blacklistModel.find({ user: { $in: [_.get(app, 'owner'), ..._.get(app, 'admins')] } });

  const arrMutedNames = _.map(muted, 'userName');
  let arrBlacklistNames = [];
  _.forEach(blackLists, (el) => { arrBlacklistNames = _.union(arrBlacklistNames, el.blackList); });

  const { usersData } = await User.find({
    condition: { name: { $in: _.uniq([...arrMutedNames, ...arrBlacklistNames]) } },
    select: { name: 1, followers_count: 1, wobjects_weight: 1 },
  });
  const { mutedUsers } = getMutedList(muted, usersData);
  const { blacklistUsers } = getBlacklist(arrBlacklistNames, blackLists, usersData);

  return {
    result: {
      mutedUsers,
      blacklistUsers,
      mutedCount: mutedUsers.length,
      blacklistedCount: blacklistUsers.length,
    },
  };
};

const getMutedList = (muted, usersData) => {
  if (_.isEmpty(muted)) return { mutedUsers: [] };
  return {
    mutedUsers: _.map(muted, (el) => {
      const user = _.find(usersData, (o) => o.name === el.userName);
      return {
        name: _.get(user, 'name', el.userName),
        followers_count: _.get(user, 'followers_count', 0),
        wobjects_weight: _.get(user, 'wobjects_weight', 0),
        blockedBy: el.mutedBy,
      };
    }),
  };
};

const getBlacklist = (arrBlacklistNames, blackLists, usersData) => {
  if (_.isEmpty(arrBlacklistNames)) return { blacklistUsers: [] };
  return {
    blacklistUsers: _.map(arrBlacklistNames, (el) => {
      const user = _.find(usersData, (o) => o.name === el);
      return {
        name: _.get(user, 'name', el),
        followers_count: _.get(user, 'followers_count', 0),
        wobjects_weight: _.get(user, 'wobjects_weight', 0),
        blockedBy: _.compact(
          _.map(blackLists, (o) => { if (_.includes(o.blackList, el)) return o.user; }),
        ),
      };
    }),
  };
};
