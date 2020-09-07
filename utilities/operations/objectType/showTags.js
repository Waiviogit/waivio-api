const { redisGetter } = require('utilities/redis');
const { FIELDS_NAMES } = require('constants/wobjectsData');

module.exports = async ({ tagCategory, limit, skip }) => {
  const { tags, error } = await redisGetter.getTagCategories({ key: `${FIELDS_NAMES.TAG_CATEGORY}:${tagCategory}`, start: skip, end: skip + (limit) });
  if (error) return { error };

  return { tags: tags.slice(0, limit), hasMore: tags.length === limit + 1 };
};
