const { Wobj, User } = require('models');
const { UserExpertise } = require('database').models;
const _ = require('lodash');
const { redisGetter } = require('utilities/redis');
const {
  REQUIREDFIELDS, REQUIREDFIELDS_SEARCH, REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');

const getCondition = (data) => {
  const findParams = {};
  if (data.author_permlinks.length) {
    findParams.author_permlink = { $in: data.author_permlinks };
  }

  if (data.object_types.length) {
    findParams.object_type = { $in: data.object_types };
  }
  if (data.sample) {
    findParams['status.title'] = { $nin: REMOVE_OBJ_STATUSES };
  }
  return findParams;
};

const getMany = async (data) => {
  data.required_fields = _.uniq([...data.required_fields, ...REQUIREDFIELDS]);
  const condition = getCondition(data);

  const pipeline = [
    { $match: condition },
    { $sort: { weight: -1 } },
    {
      $project: {
        default_name: 1,
        weight: 1,
        parent: 1,
        fields: 1,
        object_type: 1,
        author_permlink: 1,
        author: 1,
      },
    },
  ];

  pipeline.push(...[{ $skip: data.skip }, { $limit: data.sample ? 100 : data.limit + 1 }]);
  if (data.sample) pipeline.push({ $sample: { size: 5 } });
  // eslint-disable-next-line prefer-const
  let { wobjects: wObjects = [], error } = await Wobj.fromAggregation(pipeline);
  /** Data sample use for short info about wobject, it must be light request */
  if (data.sample) {
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
        const userWobjects = await UserExpertise
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
  const { user } = await User.getOne(data?.userName ?? '', SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: wObjects });

  return {
    hasMore: wObjects.length > data.limit,
    wObjectsData: wObjects.slice(0, data.limit),
  };
};

module.exports = { getMany };
