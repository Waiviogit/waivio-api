const { ObjectType } = require('models');

const makeCountPipeline = (string, supportedTypes) => {
  const condition = { $and: [{ name: { $regex: `${string}`, $options: 'i' } }] };
  if (supportedTypes.length)condition.$and.push({ name: { $in: supportedTypes } });
  return [{ $match: condition }, { $count: 'count' }];
};

exports.searchObjectTypes = async ({
  string, limit, skip, supportedTypes = [],
}) => {
  const { objectTypes = [] } = await ObjectType.search({
    string, limit, skip, supportedTypes,
  });
  const {
    result: [
      { count: objectTypesCount = 0 } = {}] = [],
  } = await ObjectType.aggregate(makeCountPipeline(string, supportedTypes));

  return { objectTypes, objectTypesCount };
};
