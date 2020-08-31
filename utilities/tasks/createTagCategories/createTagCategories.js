const _ = require('lodash');
const { Wobj } = require('models');
const { ObjectType } = require('database').models;
const { redisSetter } = require('utilities/redis');

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

  const { wobjects } = await Wobj.fromAggregation(pipeline);
  return { tagCategories: wobjects };
};

const addDataToRedis = async (tagCategories) => {
  for (const category of tagCategories) {
    const sliceTo = category._id === 'Ingredients' ? 100 : 10;
    category.tags = _
      .chain(category.tags)
      .filter((tag) => tag.weight > 0)
      .orderBy('weight', 'desc')
      .map('name')
      .uniq()
      .slice(0, sliceTo)
      .value();
    if (!category.tags.length) continue;
    let counter = 0;
    const tags = [];
    for (let i = 0; i < category.tags.length; i++) {
      tags[counter++] = 0;
      tags[counter++] = category.tags[i];
    }
    await redisSetter.addTagCategory({ categoryName: category._id, tags });
  }
};

module.exports = async () => {
  const objectTypes = await ObjectType.find().lean();
  for (const obj of objectTypes) {
    let tagCategory = false;
    if (_.has(obj, 'supposed_updates')) {
      tagCategory = _.get(_.find(obj.supposed_updates, (o) => o.name === 'tagCategory'), 'values');
    }
    if (!tagCategory) continue;
    const { tagCategories } = await findTagsForTagCategory(tagCategory, obj.name);
    if (!tagCategories) continue;
    await addDataToRedis(tagCategories);
  }
};
