const { EngineAccountHistory } = require('../database').models;

exports.find = async ({
  condition, skip, limit, sort,
}) => {
  try {
    return {
      result: await EngineAccountHistory
        .find(condition)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};
