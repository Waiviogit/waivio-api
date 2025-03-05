const { Post } = require('../../../models');

module.exports = async ({ name, skip = 0, limit = 30 }) => Post.aggregate([
  { $match: { author: name, reblog_to: null } },
  { $unwind: '$wobjects' },
  { $group: { _id: '$wobjects.author_permlink', posts_count: { $sum: 1 } } },
  { $sort: { posts_count: -1, _id: -1 } },
  { $skip: skip },
  { $limit: limit },
  { $project: { _id: 0, author_permlink: '$_id', posts_count: 1 } },
  {
    $lookup: {
      from: 'wobjects',
      localField: 'author_permlink',
      foreignField: 'author_permlink',
      as: 'wobject',
    },
  },
  { $unwind: '$wobject' },
]);
