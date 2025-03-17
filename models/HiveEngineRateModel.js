const { HiveEngineRate } = require('../currenciesDB').models;

exports.find = async ({
  condition, projection, sort = {}, limit, skip = 0,
}) => {
  try {
    return {
      result: await HiveEngineRate
        .find(condition, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};
