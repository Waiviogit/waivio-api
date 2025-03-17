const _ = require('lodash');
const { getTagsByUser } = require('../../helpers/postHelper');

module.exports = async ({
  name, skip, limit, checkedTags,
}) => {
  const { tags } = await getTagsByUser({
    author: name, skip, limit, checkedTags,
  });

  return {
    tags: _.take(tags, limit),
    hasMore: tags.length > limit,
  };
};
