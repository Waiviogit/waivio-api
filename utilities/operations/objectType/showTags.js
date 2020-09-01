const { redisGetter } = require('utilities/redis');
const { FIELDS_NAMES } = require('constants/wobjectsData');

module.exports = async ({ tagCategory, limit, skip }) => {
  try {
    const tags = await redisGetter.getTagCategories({ key: `${FIELDS_NAMES.TAG_CATEGORY}:${tagCategory}`, start: skip, end: skip + (limit - 1) });
    return { tagCategory, tags };
  } catch (error) {
    return { error };
  }
};
