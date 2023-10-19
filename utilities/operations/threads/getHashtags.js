const { ThreadModel } = require('models');
const _ = require('lodash');

const getTrendingHashTagsWithCount = async ({ skip = 0, limit = 50 }) => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: threeDaysAgo },
        hashtags: { $exists: true, $ne: [] }, // Filter out threads with no hashtags
      },
    },
    {
      $unwind: '$hashtags',
    },
    {
      $group: {
        _id: '$hashtags',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        hashtag: '$_id',
        count: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
  ];

  const { result } = await ThreadModel.aggregate({ pipeline });

  return {
    result: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

module.exports = {
  getTrendingHashTagsWithCount,
};
