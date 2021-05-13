const PostModel = require('database').models.Post;
const { getNamespace } = require('cls-hooked');
const AppModel = require('models/AppModel');
const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');

exports.getAllPosts = async (data) => {
  try {
    const aggregatePipeline = [
      { $match: { ...getBlockedAppCond() } },
      { $sort: { _id: -1 } },
      { $skip: data.skip },
      { $limit: data.limit },
      {
        $lookup: {
          from: 'wobjects',
          localField: 'wobjects.author_permlink',
          foreignField: 'author_permlink',
          as: 'fullObjects',
        },
      },
    ];
    if (data.filter) {
      if (data.filter.byApp) {
        const { app } = await AppModel.getOne({ name: data.filter.byApp });

        if (app && app.supported_objects.length) {
          aggregatePipeline.unshift({
            $match: {
              'wobjects.author_permlink': { $in: app.supported_objects },
            },
          });
        }
      }
    }
    const posts = await PostModel.aggregate(aggregatePipeline);

    return { posts };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (pipeline) => {
  try {
    const posts = await PostModel.aggregate(pipeline);

    if (_.isEmpty(posts)) {
      return { error: { status: 404, message: 'Posts not found!' } };
    }
    return { posts };
  } catch (error) {
    return { error };
  }
};

exports.getByFollowLists = async ({
  author_permlinks: authorPermlinks,
  user_languages: userLanguages,
  hiddenPosts = [],
  filtersData,
  users,
  muted,
  skip,
  limit,
}) => {
  const cond = {
    $or: [{ author: { $in: users } }, { 'wobjects.author_permlink': { $in: authorPermlinks } }],
    ...getBlockedAppCond(),
  };
  // for filter by App wobjects
  if (_.get(filtersData, 'require_wobjects')) {
    cond['wobjects.author_permlink'] = { $in: [...filtersData.require_wobjects] };
  }

  if (!_.isEmpty(authorPermlinks)) cond.language = { $in: userLanguages };
  if (!_.isEmpty(hiddenPosts)) cond._id = { $nin: hiddenPosts };
  if (!_.isEmpty(muted)) cond.author = { $nin: muted };

  const postsQuery = PostModel.find(cond)
    .sort({ _id: -1 })
    // .skip(skip)
    .limit(limit)
    .populate({ path: 'fullObjects', select: 'parent fields weight author_permlink object_type default_name' })
    .lean();

  if (_.get(filtersData, 'lastId')) {
    postsQuery.where('_id').lt(ObjectId(filtersData.lastId));
  } else {
    postsQuery.skip(skip);
  }

  try {
    const posts = await postsQuery.exec();
    if (_.isEmpty(posts)) {
      return { error: { status: 404, message: 'Posts not found!' } };
    }
    return { posts };
  } catch (error) {
    return { error };
  }
};

exports.getPostsRefs = async ({ skip = 0, limit = 1000 } = {}) => {
  try {
    return {
      posts: await PostModel.aggregate([
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            author: 1,
            permlink: 1,
            'wobjects.author_permlink': 1,
            'wobjects.percent': 1,
          },
        },
      ]),
    };
  } catch (error) {
    return { error };
  }
};

exports.getBlog = async ({
  name, skip = 0, limit = 30, additionalCond = {},
}) => {
  try {
    return {
      posts: await PostModel
        .find({ author: name, ...getBlockedAppCond(), ...additionalCond })
        .sort({ _id: -1 }).skip(skip).limit(limit)
        .populate({ path: 'fullObjects', select: '-latest_posts' })
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

// eslint-disable-next-line camelcase
exports.getOne = async ({ author, permlink, root_author }) => {
  try {
    const cond = author ? { author, permlink } : { root_author, permlink };

    return { post: await PostModel.findOne(cond).populate({ path: 'fullObjects', select: '-latest_posts' }).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findByBothAuthors = async ({ author, permlink }) => {
  try {
    return {
      result: await PostModel.find({
        $or: [{ author, permlink }, { root_author: author, permlink }],
      }).lean(),
    };
  } catch (error) {
    return { error };
  }
};

/**
 * Find and return posts by array [{author, permlink}] of posts refs
 * @param postsRefs {Array<Object>}
 * @returns {Promise<{posts: *}|{error: *}>}
 */
exports.getManyPosts = async (postsRefs) => {
  try {
    return {
      posts: await PostModel
        .find({ $or: [...postsRefs], ...getBlockedAppCond() })
        .populate({ path: 'fullObjects', select: 'parent fields weight author_permlink object_type default_name' })
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

exports.findByCondition = async (condition, select = {}) => {
  try {
    return { posts: await PostModel.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getWobjectPosts = async ({
  condition, limit, lastId, skip,
}) => {
  try {
    const postsQuery = PostModel
      .find(condition)
      .sort({ _id: -1 })
      .limit(limit)
      .populate({ path: 'fullObjects', select: 'parent fields weight author_permlink object_type default_name' })
      .lean();

    if (!lastId) postsQuery.skip(skip);
    return { posts: await postsQuery.exec() };
  } catch (error) {
    return { error };
  }
};

const getBlockedAppCond = () => {
  try {
    const session = getNamespace('request-session');
    const host = session.get('host');
    return { blocked_for_apps: { $ne: host } };
  } catch (error) {
    return {};
  }
};
