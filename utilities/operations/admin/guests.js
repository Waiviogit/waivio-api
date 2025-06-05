const _ = require('lodash');
const { User, GuestSpamModel, mutedUserModel } = require('../../../models');
const { WAIVIO_ADMINS_ENV } = require('../../../constants/common');

const USER_KEYS = {
  name: 1,
  alias: 1,
  last_posts_count: 1,
  followers_count: 1,
  wobjects_weight: 1,
  last_root_post: 1,
  posting_json_metadata: 1,
  blocked: 1,
};

const getGuestUsersList = async ({
  skip, limit, spamDetected = false, searchString = '',
}) => {
  const nameToSearch = searchString.startsWith('waivio_')
    ? searchString
    : `waivio_${searchString}`;

  const condition = searchString
    ? { name: { $regex: `^${nameToSearch}` } }
    : { name: { $regex: /^waivio_/ } };

  const { usersData } = await User.find({
    condition: {
      ...condition,
      ...spamDetected && { spamDetected },
    },
    skip,
    limit: limit + 1,
    sort: {
      name: 1,
    },
    select: USER_KEYS,
  });

  const { result: mutedList } = await mutedUserModel.find({
    condition: {
      mutedBy: { $in: WAIVIO_ADMINS_ENV },
      userName: { $in: usersData.map((v) => v.name) },
    },
  });

  usersData.forEach((v) => {
    v.mutedBy = mutedList.filter((m) => m.userName === v.name).map((el) => el.mutedBy);
  });

  return {
    result: _.take(usersData, limit),
    hasMore: usersData?.length > limit,
  };
};

const blockGuestUser = async ({ name, blocked }) => {
  if (!name.includes('_')) return { error: { status: 401 } };
  const { result } = await User.findOneAndUpdate({
    filter: { name },
    update: { blocked },
    options: {
      new: true,
      projection: USER_KEYS,
    },
  });

  return { result };
};

const getSpamDetectionsByUserName = async ({ name, skip, limit }) => {
  const { result } = await GuestSpamModel.find({
    filter: { account: name },
    options: {
      skip,
      limit: limit + 1,
    },
  });

  return {
    result: _.take(result, limit),
    hasMore: result?.length > limit,
  };
};

module.exports = {
  getGuestUsersList,
  blockGuestUser,
  getSpamDetectionsByUserName,
};
