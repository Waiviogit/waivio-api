const _ = require('lodash');
const { incrementTag } = require('utilities/redis/redisSetter');
const { WObject, ObjectType } = require('database').models;

const getObjects = async ({ objectTypes, tags }) => {
  try {
    return WObject.find(
      {
        object_type: { $in: objectTypes },
        'fields.tagCategory': { $in: tags },
      },
      {
        fields: 1,
        object_type: 1,
      },
    ).lean();
  } catch (error) {
    return [];
  }
};

const getObjectTypes = async ({ objectTypes }) => {
  try {
    return ObjectType.find({ name: { $in: objectTypes } }).lean();
  } catch (error) {
    return [];
  }
};

const fillTagCategory = async (params) => {
  const objectTypes = params.split(',');

  const objectTypeDocs = await getObjectTypes({ objectTypes });
  if (_.isEmpty(objectTypeDocs)) return;
  const tagCategories = _.reduce(objectTypeDocs, (acc, el, index) => {
    const tagCategory = _.find(el.supposed_updates, (u) => u.name === 'tagCategory');
    if (!tagCategory) return acc;
    acc[el.name] = tagCategory.values;
    return acc;
  }, {});

  const tags = _.reduce(tagCategories, (acc, el) => [...acc, ...el], []);

  const objects = await getObjects({ objectTypes, tags });
  if (_.isEmpty(objects)) return;

  for (const object of objects) {
    const fields = _.filter(object.fields, (f) => _.includes(tagCategories[object.object_type], f.tagCategory));
    for (const field of fields) {
      await incrementTag({
        objectType: object.object_type,
        tag: field.body,
        categoryName: field.tagCategory,
      });
    }
  }
  console.log('task finished');
};

module.exports = fillTagCategory;
