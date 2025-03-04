const { getTagsByUser } = require('../../helpers/postHelper');
const _ = require('lodash');

module.exports = async ({ name, skip, limit }) => {
  const { tags } = await getTagsByUser({ author: name, skip, limit });

  return {
    tags: _.take(tags, limit),
    hasMore: tags.length > limit,
  };
};
