const _ = require('lodash');
const { getTagsByUser } = require('../../helpers/postHelper');

module.exports = async ({ name, skip, limit }) => {
  const { tags } = await getTagsByUser({ author: name, skip, limit });

  return {
    tags: _.take(tags, limit),
    hasMore: tags.length > limit,
  };
};
