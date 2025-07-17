const _ = require('lodash');
const { Post } = require('../../../models');

const getUserPostTitles = async ({ userName, skip, limit }) => {
  const { result = [] } = await Post.find({
    filter: { author: userName },
    projection: {
      title: 1,
    },
    options: {
      sort: { _id: -1 },
      skip,
      limit: limit + 1,
    },
  });

  return { result: _.take(result, limit), hasMore: result.length > limit };
};


module.exports = {
  getUserPostTitles
}
