const { ThreadModel } = require('models');
const _ = require('lodash');

const getSortOrder = (sort) => (sort === 'latest'
  ? { createdAt: -1 }
  : { createdAt: 1 });

const byHashtag = async ({
  hashtag, skip, limit, sort,
}) => {
  const { result } = await ThreadModel.find({
    filter: { hashtags: hashtag },
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
  user, skip, limit, sort,
}) => {
  const { result } = await ThreadModel.find({
    filter: { mentions: user },
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
