const _ = require('lodash');
const { ObjectType } = require('database').models;
const { Wobj: wobjModel } = require('models');

const findTagsForTagCategory = async (tagCategory = [], objectType) => {
  const pipeline = [
    {
      $match: {
        object_type: objectType,
        tagCategories: { $exists: true, $ne: [] },
      },
    },
    { $unwind: '$tagCategories' },
    {
      $group: {
        _id: '$tagCategories.body',
        tags: { $addToSet: '$tagCategories.categoryItems' },
      },
    },
    { $match: { _id: { $in: [...tagCategory] } } },
    {
      $addFields:
        {
          tags:
            {
              $reduce: {
                input: '$tags',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] },
              },
            },
        },
    },
    { $unwind: '$tags' },
    { $group: { _id: '$_id', tags: { $addToSet: '$tags' } } },
  ];

  const { wobjects } = await wobjModel.fromAggregation(pipeline);
  return { tagCategories: wobjects };
};

const prepareDataForRedis = (tagCategories) => {
  const preparedData = _.map(tagCategories, (category) => ({
    categoryName: category._id,
    tags: _
      .chain(category.tags)
      .filter((tag) => tag.weight > 0)
      .orderBy('weight', 'desc')
      .uniqBy('name')
      .slice(0, 10)
      .value(),
  }));
  return { preparedData };
};

module.exports = async () => {
  const objectTypes = await ObjectType.find().lean();
  for (const obj of objectTypes) {
    let tagCategory = false;
    if (_.has(obj, 'supposed_updates')) {
      tagCategory = _.find(obj.supposed_updates, (o) => o.name === 'tagCategory').values;
    }
    if (!tagCategory) continue;
    const { tagCategories } = await findTagsForTagCategory(tagCategory, obj.name);
    const { preparedData } = prepareDataForRedis(tagCategories);
  }
};
