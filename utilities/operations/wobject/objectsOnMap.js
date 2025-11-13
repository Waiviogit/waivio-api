const _ = require('lodash');
const { FIELDS_NAMES } = require('@waivio/objects-processor');
const { addCampaignsToWobjectsSites } = require('../../helpers/campaignsHelper');
const {
  REMOVE_OBJ_STATUSES,
  REQUIREDFILDS_WOBJ_LIST,
} = require('../../../constants/wobjectsData');
const searchHelper = require('../../helpers/searchHelper');
const {
  Wobj, Post,
  mutedUserModel,
} = require('../../../models');
const { processWobjects } = require('../../helpers/wObjectHelper');
const config = require('../../../config');

exports.getExpertsFromArea = async ({
  box, skip, limit, app,
}) => {
  const pipe = await makeExpertsByAreaPipe({
    box, skip, limit, app,
  });
  const { wobjects: experts, error } = await Wobj.fromAggregation(pipe);
  if (error) return { error };

  return {
    users: _.take(experts, limit),
    hasMore: experts.length > limit,
  };
};

exports.getLastPostOnObjectFromArea = async ({
  box, skip, limit, app, objectType, currentUser,
}) => {
  const pipe = await makeLastPostOnAreaPipe({
    box, skip, limit, app, objectType,
  });
  const { wobjects, error } = await Wobj.fromAggregation(pipe);
  if (error) return { error };
  const wobjectsWithCampaigns = await addCampaignsToWobjectsSites(
    { wobjects, app },
  );

  const processed = await processWobjects({
    wobjects: _.take(wobjectsWithCampaigns, limit),
    fields: [...REQUIREDFILDS_WOBJ_LIST, FIELDS_NAMES.REMOVE],
    app,
    returnArray: true,
  });

  const { result } = await mutedUserModel.find({
    condition: {
      $or: [
        { mutedForApps: app.host },
        { mutedForApps: config.appHost },
        { mutedBy: currentUser },
      ],
    },
    sort: { _id: -1 },
  });
  const muted = _.uniq(_.map(result, 'userName'));

  await Promise.all(processed.map(async (processedElement) => {
    const removeCondition = processedElement?.remove?.length
      ? _.reduce(processedElement.remove, (acc, el) => {
        const [author, permlink] = el.split('/');
        if (author) acc.author.$nin.push(author);
        if (permlink) acc.permlink.$nin.push(permlink);
        return acc;
      }, { author: { $nin: [] }, permlink: { $nin: [] } })
      : { author: { $nin: [] }, permlink: { $nin: [] } };

    if (muted.length) {
      removeCondition.author.$nin.push(...muted);
    }

    const { result: post } = await Post.findOne({
      filter: {
        'wobjects.author_permlink': processedElement.author_permlink,
        ...removeCondition,
      },
      options: { sort: { _id: -1 } },
    });
    if (post) {
      processedElement.post = post;
    }
  }));

  return {
    wobjects: processed,
    hasMore: wobjectsWithCampaigns.length > limit,
  };
};

const makeExpertsByAreaPipe = async ({
  box, skip, limit, app,
}) => {
  const { supportedTypes, crucialWobjects, forSites } = await searchHelper.getAppInfo({ app });
  return [
    {
      $match: {
        map: {
          $geoWithin: {
            $box: [box.bottomPoint, box.topPoint],
          },
        },
      },
    },
    {
      $match: {
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...(!_.isEmpty(supportedTypes) && { object_type: { $in: supportedTypes } }),
        ...(forSites && { author_permlink: { $in: crucialWobjects } }),
      },
    },
    {
      $lookup: {
        from: 'user_wobjects',
        localField: 'author_permlink',
        foreignField: 'author_permlink',
        as: 'experts',
      },
    },
    {
      $unwind: { path: '$experts' },
    },
    {
      $replaceRoot: { newRoot: '$experts' },
    },
    {
      $group: { _id: '$user_name', weight: { $sum: '$weight' } },
    },
    {
      $sort: { weight: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'name',
        as: 'user',
      },
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        followers_count: { $arrayElemAt: ['$user.followers_count', 0] },
        weight: '$weight',
      },
    },
  ];
};

const makeLastPostOnAreaPipe = async ({
  box, skip, limit, app, objectType,
}) => {
  const { crucialWobjects, forSites } = await searchHelper.getAppInfo({ app });
  return [
    {
      $match: {
        map: {
          $geoWithin: {
            $box: [box.bottomPoint, box.topPoint],
          },
        },
      },
    },
    {
      $match: {
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        latest_posts: { $exists: true, $type: 'array', $ne: [] },
        object_type: objectType,
        ...(forSites && { author_permlink: { $in: crucialWobjects } }),
      },
    },
    {
      $sort: { activeCampaignsCount: -1, weight: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
  ];
};
