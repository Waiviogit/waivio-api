const { Wobj } = require('models');
const UserWobjectsModel = require('database').models.UserWobjects;
const _ = require('lodash');
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
    condition, 'default_name weight parent fields',
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
    const usersWobjects = await UserWobjectsModel
      .find({ author_permlink: { $in: _.map(wObjects, 'author_permlink') } })
      .select({ _id: 0, weight: 1, user_name: 1 });
    wObjects.forEach((obj) => {
      obj.users = _
        .chain(usersWobjects)
        .filter((user) => user.author_permlink === obj.author_permlink)
        .slice(0, 5)
        .value();
      obj.user_count = obj.users.length;
    });
  } // assign top users to each of wobject

  return {
    hasMore: wObjects.length > data.limit,
    wObjectsData: wObjects.slice(0, data.limit),
  };
};

module.exports = { getMany };
