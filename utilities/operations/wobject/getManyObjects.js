const { Wobj } = require('models');
const UserWobjectsModel = require('database').models.UserWobjects;
const _ = require('lodash');
const { redisGetter } = require('utilities/redis');
const { REQUIREDFIELDS, REQUIREDFIELDS_SEARCH } = require('constants/wobjectsData');

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
  let { result: wObjects, error } = await Wobj.find(
    condition, 'default_name weight parent fields object_type author_permlink',
    { weight: -1 }, data.skip, data.sample ? 100 : data.limit + 1,
  );
  if (data.sample) {
    wObjects = _.sampleSize(wObjects, 5);
    wObjects = wObjects.map((obj) => {
      obj.fields = _.filter(obj.fields, (field) => _.includes(REQUIREDFIELDS_SEARCH, field.name));
      return obj;
    });
  }
  if (error) return { error };

  if (data.user_limit && !data.sample) {
    await Promise.all(wObjects.map(async (wobj) => {
      const ids = await redisGetter.getTopWobjUsers(wobj.author_permlink);
      const userWobjects = await UserWobjectsModel.find(
        { _id: { $in: ids } },
      ).lean();
      wobj.users = _.map(userWobjects, (user) => ({
        name: user.user_name,
        weight: user.weight,
      }));
      wobj.user_count = wobj.users.length;
    }));
  } // assign top users to each of wobject

  return {
    hasMore: wObjects.length > data.limit,
    wObjectsData: wObjects.slice(0, data.limit),
  };
};

module.exports = { getMany };
