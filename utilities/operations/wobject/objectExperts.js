const { UserExpertiseModel, User, Wobj } = require('models');
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');
const { EXPERTS_SORT } = require('constants/sortData');

// eslint-disable-next-line camelcase
const getMultipliers = (newsFilter, author_permlink) => {
  const array = _.flatten(newsFilter.allowList);
  const count = array.length;
  const values = _.uniq(array);

  if (_.isEmpty(values)) return [{ author_permlink, multiplier: 1 }];
  return values.map((value) => ({
    author_permlink: value,
    multiplier: (_.filter(newsFilter.allowList,
      (items) => _.includes(items, value)).length) / count,
  }));
};

const makeSwitchBranches = (wobjects) => wobjects.map((wobject) => ({
  case: { $eq: ['$author_permlink', wobject.author_permlink] },
  then: wobject.multiplier,
}));

const makePipeline = ({
  multipliers, skip = 0, limit = 30, user,
}) => {
  const switchBranches = makeSwitchBranches(multipliers);

  const pipeline = [
    { $match: { author_permlink: { $in: multipliers.map((w) => w.author_permlink) } } },
    {
      $group: {
        _id: '$user_name',
        totalWeight: {
          $sum: { $multiply: ['$weight', { $switch: { branches: switchBranches, default: 0 } }] },
        },
      },
    },
    { $sort: { totalWeight: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _id: 0, name: '$_id', weight: '$totalWeight' } },
  ];

  if (user) pipeline[0].$match.user_name = user;
  return pipeline;
};

const getWobjExperts = async ({
  // eslint-disable-next-line camelcase
  author_permlink, skip = 0, limit = 30, sort, user, newsFilter,
}) => {
  let userExpert;
  const { result: wobj, error: wobjErr } = await Wobj.findOne({ author_permlink });
  if (wobjErr || !wobj) return { error: wobjErr || { status: 404, message: 'Wobject not found!' } };

  if (!newsFilter) {
    if (user) {
      const { experts, error } = await getExpertsByUserWobject({
        authorPermlink: author_permlink, username: user,
      });
      if (error) return { error };
      userExpert = _.get(experts, '[0]');
    }
    const { experts, error } = await getExpertsByUserWobject({
      authorPermlink: author_permlink, skip, limit, sort, weight: true,
    });
    if (error) return { error };

    if (sort === EXPERTS_SORT.FOLLOWERS) return { experts };
    const { result, error: getFollowersErr } = await getFollowersCount({ experts, userExpert });
    if (getFollowersErr) return { error: getFollowersErr };
    return { experts: result, userExpert };
  }

  const field = _.find(wobj.fields, (element) => element.permlink === newsFilter);
  const fullField = !_.isEmpty(field) ? Object.assign(field, jsonHelper.parseJson(_.get(field, 'body'))) : {};
  const multipliers = getMultipliers(fullField, author_permlink);
  const pipeline = makePipeline({ multipliers, skip, limit });
  const { result: experts, error: aggregationError } = await UserExpertiseModel.aggregate(pipeline);

  if (aggregationError) return { error: aggregationError };
  if (user) {
    const userPipeline = makePipeline({
      multipliers, skip, limit, user,
    });
    const { result: expertsByUserName, error } = await UserExpertiseModel.aggregate(userPipeline);

    if (error) return { error };
    userExpert = _.get(expertsByUserName, '[0]');
  }
  const { result, error: getFollowersErr } = await getFollowersCount({ experts, userExpert });
  if (getFollowersErr) return { error: getFollowersErr };
  return { experts: result, userExpert };
};

const getFollowersCount = async ({ experts, userExpert }) => {
  const { usersData, error } = await User.find({
    condition: { name: { $in: _.compact([..._.map(experts, 'name'), _.get(userExpert, 'name')]) } },
    select: { name: 1, followers_count: 1 },
  });
  if (error) return { error };
  if (userExpert) {
    const expert = _.find(usersData, (el) => el.name === userExpert.name);
    userExpert.followers_count = _.get(expert, 'followers_count', 0);
  }
  return {
    result: _.forEach(experts, (el) => {
      const user = _.find(usersData, (obj) => obj.name === el.name);
      el.followers_count = _.get(user, 'followers_count', 0);
    }),
  };
};

const getExpertsByUserWobject = async (data) => {
  switch (data.sort) {
    case EXPERTS_SORT.RANK:
      return UserExpertiseModel.getExpertsWithoutMergingCollections({ ...data, sort: { $sort: { weight: -1 } } });
    case EXPERTS_SORT.ALPHABET:
      return UserExpertiseModel.getExpertsWithoutMergingCollections({ ...data, sort: { $sort: { user_name: 1 } } });
    case EXPERTS_SORT.FOLLOWERS:
      return UserExpertiseModel.getExpertsByFollowersFromUserModel({ ...data });
    case EXPERTS_SORT.RECENCY:
      return UserExpertiseModel.getExpertsWithoutMergingCollections({ ...data, sort: { $sort: { _id: -1 } } });
  }
};
module.exports = { getWobjExperts };
