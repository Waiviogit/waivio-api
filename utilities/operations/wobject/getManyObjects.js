const { Wobj } = require('models');
const UserWobjectsModel = require('database').models.UserWobjects;
const _ = require('lodash');
const { REQUIREDFIELDS } = require('constants/wobjectsData');

const getCondition = (data) => {
  const findParams = {};
  if (data.author_permlinks.length) {
    findParams.author_permlink = { $in: data.author_permlinks };
  }

  if (data.object_types.length) {
    findParams.object_type = { $in: data.object_types };
  } else if (data.exclude_object_types.length) {
    findParams.object_type = { $nin: data.exclude_object_types };
  }
  if (data.sample) {
    findParams['status.title'] = { $nin: ['unavailable', 'relisted'] };
  }
  return findParams;
};

const getMany = async (data) => {
  data.required_fields = _.uniq([...data.required_fields, ...REQUIREDFIELDS]);
  const condition = getCondition(data);
  // eslint-disable-next-line prefer-const
  let { result: wObjects, error } = await Wobj.find(condition, '', { weight: -1 }, data.skip, data.sample ? 100 : data.limit + 1);
  if (data.sample) wObjects = _.sampleSize(wObjects, 5);
  if (error) return { error };

  if (data.user_limit) {
    await Promise.all(wObjects.map(async (wobject) => {
      wobject.users = await UserWobjectsModel.aggregate([
        { $match: { author_permlink: wobject.author_permlink } },
        { $sort: { weight: -1 } },
        { $limit: data.user_limit },
        {
          $project: {
            _id: 0,
            name: '$user_name',
            weight: 1,
          },
        },
      ]);
      wobject.user_count = wobject.users.length;
    }));
  } // assign top users to each of wobject

  return {
    hasMore: wObjects.length > data.limit,
    wObjectsData: wObjects.slice(0, data.limit),
  };
};

module.exports = { getMany };
