const { ThreadModel, mutedUserModel } = require('models');
const _ = require('lodash');

const getSortOrder = (sort) => (sort === 'latest'
  ? { createdAt: -1 }
  : { createdAt: 1 });

const byHashtag = async ({
  hashtag, skip, limit, sort, userName,
}) => {
  const { result: muted } = await mutedUserModel.find({ condition: { mutedBy: userName } });

  const { result } = await ThreadModel.find({
    filter: {
      hashtags: hashtag,
      ...(muted.length && { author: { $nin: _.map(muted, 'userName') } }),
    },
    options: {
      sort: getSortOrder(sort),
      skip,
      limit: limit + 1,
    },
  });

  return {
    result: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

const byUser = async ({
  user, skip, limit, sort, userName,
}) => {
  const { result: muted } = await mutedUserModel.find({ condition: { mutedBy: userName } });
  const { result } = await ThreadModel.find({
    filter: {
      $or: [{ mentions: user }, { author: user }],
      ...(muted.length && { author: { $nin: _.map(muted, 'userName') } }),
    },
    options: {
      sort: getSortOrder(sort),
      skip,
      limit: limit + 1,
    },
  });

  return {
    result: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

module.exports = {
  byHashtag,
  byUser,
};
