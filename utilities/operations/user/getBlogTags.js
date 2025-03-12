const _ = require('lodash');
const { getTagsByUser } = require('../../helpers/postHelper');

module.exports = async ({
  name, skip, limit, checkedTags,
}) => {
  let { tags } = await getTagsByUser({ author: name, skip, limit });

  if (checkedTags?.length) {
    tags = tags.sort((a, b) => checkedTags.indexOf(a.author_permlink) - checkedTags.indexOf(b.author_permlink));
  }

  return {
    tags: _.take(tags, limit),
    hasMore: tags.length > limit,
  };
};
