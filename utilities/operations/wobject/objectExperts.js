const { UserWobjects } = require('models');
const { WObject } = require('database').models;
const _ = require('lodash');

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
  author_permlink, skip = 0, limit = 30, user,
}) => {
  let wobj;
  let userExpert;

  try {
    wobj = await WObject.findOne({ author_permlink }).lean();
    if (!wobj) return { error: { status: 404, message: 'Wobject not found!' } };
  } catch (error) {
    return { error };
  }

  if (!wobj.newsFilter) {
    if (user) {
      const { experts, error } = await UserWobjects.getByWobject({
        authorPermlink: author_permlink, username: user,
      });

      if (error) return { error };
      userExpert = _.get(experts, '[0]');
    }
    const { experts, error } = await UserWobjects.getByWobject({
      authorPermlink: author_permlink, skip, limit, weight: true,
    });

    if (error) return { error };
    return { experts, userExpert };
  }

  const multipliers = getMultipliers(wobj.newsFilter, author_permlink);
  const pipeline = makePipeline({ multipliers, skip, limit });
  const { result: experts, error: aggregationError } = await UserWobjects.aggregate(pipeline);

  if (aggregationError) return { error: aggregationError };
  if (user) {
    const userPipeline = makePipeline({
      multipliers, skip, limit, user,
    });
    const { result: expertsByUserName, error } = await UserWobjects.aggregate(userPipeline);

    if (error) return { error };
    userExpert = _.get(expertsByUserName, '[0]');
  }
  return { experts, userExpert };
};

module.exports = { getWobjExperts };
