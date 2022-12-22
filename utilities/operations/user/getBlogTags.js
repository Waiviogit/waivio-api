const { getTagsByUser } = require('utilities/helpers/postHelper');
const _ = require('lodash');

module.exports = async ({ name, skip, limit }) => {
  const { tags } = await getTagsByUser({ author: name });

  return {
    tags: _.slice(tags, skip, skip + limit),
    hasMore: tags.length > skip + limit,
  };
};
