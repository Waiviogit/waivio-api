const { Wobj } = require('models');
const UserWobjectsModel = require('database').models.UserWobjects;
const _ = require('lodash');
const { redisGetter } = require('utilities/redis');
const {
  REQUIREDFIELDS, REQUIREDFIELDS_SEARCH, REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');

const getCondition = (data) => {
  const findParams = { 'status.title': { $nin: REMOVE_OBJ_STATUSES } };
  if (data.author_permlinks.length) {
    findParams.author_permlink = { $in: data.author_permlinks };
  }

  if (data.object_types.length) {
    findParams.object_type = { $in: data.object_types };
  } else if (data.exclude_object_types.length) {
    findParams.object_type = { $nin: data.exclude_object_types };
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
  /** Data sample use for short info about wobject, it must be light request */
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
      /** We have cached users in redis DB, if key not found< use mongo */
      const ids = await redisGetter.getTopWobjUsers(wobj.author_permlink);
      if (!ids || !ids.length) {
        const userWobjects = await UserWobjectsModel
          .find({ author_permlink: wobj.author_permlink })
          .sort({ weight: -1 }).limit(data.user_limit).lean();
        wobj.users = _.map(userWobjects, (user) => ({ name: user.user_name, weight: user.weight }));
      } else {
        wobj.users = _.map(ids, (id) => {
          const userData = id.split(':');
          return { name: userData[0], weight: userData[1] };
        });
      }
      wobj.user_count = wobj.users.length;
    }));
  } // assign top users to each of wobject

  return {
    hasMore: wObjects.length > data.limit,
    wObjectsData: wObjects.slice(0, data.limit),
  };
};

module.exports = { getMany };
