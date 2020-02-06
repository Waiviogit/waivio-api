const { ObjectType } = require('models');

const makeCountPipeline = (string) => [{ $match: { name: { $regex: `${string}`, $options: 'i' } } }, { $count: 'count' }];

exports.searchObjectTypes = async ({ string, limit, skip }) => {
  const { objectTypes = [] } = await ObjectType.search({ string, limit, skip });
  const {
    result: [
      { count: objectTypesCount = 0 } = {}] = [],
  } = await ObjectType.aggregate(makeCountPipeline(string));

  return { objectTypes, objectTypesCount };
};
