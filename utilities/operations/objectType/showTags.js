const { redisGetter } = require('../../redis');
const { FIELDS_NAMES } = require('../../../constants/wobjectsData');

module.exports = async ({ objectType, tagCategory, limit, skip }) => {
  const { tags, error } = await redisGetter.getTagCategories({ key: `${FIELDS_NAMES.TAG_CATEGORY}:${objectType}:${tagCategory}`, start: skip, end: skip + (limit) });
  if (error) return { error };

  return { tags: tags.slice(0, limit), hasMore: tags.length === limit + 1 };
};
