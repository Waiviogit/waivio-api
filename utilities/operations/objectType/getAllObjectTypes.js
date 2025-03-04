const { ObjectType, Wobj } = require('../../../models');

// eslint-disable-next-line camelcase
const objectTypePipeline = ({ limit, skip, wobjects_count }) => {
  const pipeline = [
    { $sort: { priority: -1 } },
    { $skip: skip },
    // eslint-disable-next-line camelcase
    { $addFields: { top_wobjects: { $slice: ['$top_wobjects', wobjects_count] } } },
  ];

  if (limit) pipeline.splice(1, 0, { $limit: limit });
  return pipeline;
};

module.exports = async ({ limit, skip, wobjects_count = 3 }) => {
  const { result: objectTypes, error } = await ObjectType.aggregate(objectTypePipeline(
    // eslint-disable-next-line camelcase
    { limit, skip, wobjects_count: wobjects_count + 1 },
  ));

  if (error) return { error };
  await Promise.all(objectTypes.map(async (type) => {
    const { result: wobjects } = await Wobj.find({ author_permlink: { $in: type.top_wobjects } },
      'parent fields weight author_permlink object_type default_name', { weight: -1 });

    type.related_wobjects = wobjects;
    // eslint-disable-next-line camelcase
    if (type.related_wobjects.length > wobjects_count) {
      type.hasMoreWobjects = true;
      type.related_wobjects = type.related_wobjects.slice(0, wobjects_count);
    }
  }));
  return { objectTypes };
};
