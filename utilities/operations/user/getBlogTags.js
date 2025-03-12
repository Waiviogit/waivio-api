const _ = require('lodash');
const { getTagsByUser } = require('../../helpers/postHelper');

module.exports = async ({
  name, skip, limit, checkedTags,
}) => {
  let { tags } = await getTagsByUser({ author: name, skip, limit });

  if (checkedTags?.length) {
    tags = tags.sort((a, b) => {
      const aIndex = checkedTags.indexOf(a.author_permlink);
      const bIndex = checkedTags.indexOf(b.author_permlink);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  return {
    tags: _.take(tags, limit),
    hasMore: tags.length > limit,
  };
};
