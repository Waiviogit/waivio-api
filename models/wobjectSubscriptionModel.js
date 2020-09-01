const { WobjectSubscriptions } = require('database').models;

exports.populate = async ({
  condition, select, sort, skip, limit, populate,
}) => {
  try {
    const result = await WobjectSubscriptions
      .find(condition)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .lean();
    return { users: result };
  } catch (error) {
    return { error };
  }
};
