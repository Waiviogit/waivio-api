const PostModel = require('database').models.Post;
const AppModel = require('models/AppModel');
const _ = require('lodash');
const { OBJECT_TYPES, FAVORITES_OBJECT_TYPES } = require('constants/wobjectsData');
const asyncLocalStorage = require('../middlewares/context/context');

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

exports.getPostsByCondition = async ({ condition, skip, limit }) => {
  try {
    const aggregatePipeline = [
      { $match: { ...condition, ...getBlockedAppCond() } },
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'wobjects',
          localField: 'wobjects.author_permlink',
          foreignField: 'author_permlink',
          as: 'fullObjects',
        },
      },
    ];
    const posts = await PostModel.aggregate(aggregatePipeline);

    return { result: posts };
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
  const pipe = [
    {
      $match: {
        author: { $in: users },
      },
    },
    {
      $match: {
        ...getBlockedAppCond(),
        ...(!_.isEmpty(hiddenPosts) && { _id: { $nin: hiddenPosts } }),
        ...(!_.isEmpty(muted) && { author: { $nin: muted }, 'reblog_to.author': { $nin: muted } }),
      },
    },
    { $sort: { _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    // we use only 4 objects
    {
      $addFields: {
        wobjects: { $slice: ['$wobjects', 4] },
      },
    },
    {
      $lookup: {
        from: 'wobjects',
        localField: 'wobjects.author_permlink',
        foreignField: 'author_permlink',
        as: 'fullObjects',
      },
    },
  ];

  // objects works bad with author condition
  const pipe2 = [
    {
      $match: {
        'wobjects.author_permlink': { $in: authorPermlinks },
        language: { $in: userLanguages },

      },
    },
    {
      $match: {
        ...getBlockedAppCond(),
        ...(!_.isEmpty(hiddenPosts) && { _id: { $nin: hiddenPosts } }),
        ...(!_.isEmpty(muted) && {
          author: { $nin: muted },
          'reblog_to.author': { $nin: muted },
        }),
      },
    },
    { $sort: { _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    // we use only 4 objects
    {
      $addFields: {
        wobjects: { $slice: ['$wobjects', 4] },
      },
    },
    {
      $lookup: {
        from: 'wobjects',
        localField: 'wobjects.author_permlink',
        foreignField: 'author_permlink',
        as: 'fullObjects',
      },
    },
  ];

  try {
    const [
      posts,
      post2,
    ] = await Promise.all([
      PostModel.aggregate(pipe),
      PostModel.aggregate(pipe2),
    ]);

    const combinedResult = [
      ...posts,
      ...post2,
    ];

    // Sort the combined result by _id in descending order
    combinedResult.sort((a, b) => b._id - a._id);

    // Paginate the combined result
    const paginatedResult = _.take(combinedResult, limit);

    if (_.isEmpty(paginatedResult)) {
      return { error: { status: 404, message: 'Posts not found!' } };
    }
    return { posts: paginatedResult };
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

exports.findOneByBothAuthors = async ({ author, permlink }) => {
  try {
    return {
      post: await PostModel.findOne({
        $or: [{ author, permlink }, { root_author: author, permlink }],
      }).lean(),
    };
  } catch (error) {
    return { error };
  }
};

exports.findOneAndUpdate = async (filter, updateData, options) => {
  try {
    return {
      result: await PostModel.findOneAndUpdate(
        filter,
        updateData,
        options,
      ).lean(),
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
        .populate({ path: 'fullObjects', select: 'author authority parent fields weight author_permlink object_type default_name' })
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

exports.findByCondition = async (condition, select = {}) => {
  try {
    return { posts: await PostModel.find({ ...condition, ...getBlockedAppCond() }, select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getWobjectPosts = async ({
  condition, limit, skip,
}) => {
  try {
    const postsQuery = PostModel
      .find(condition)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'fullObjects', select: 'author authority parent fields weight author_permlink object_type default_name status' })
      .lean();

    return { posts: await postsQuery.exec() };
  } catch (error) {
    return { error };
  }
};

exports.find = async ({ filter, projection, options }) => {
  try {
    return { result: await PostModel.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getProductLinksFromPosts = async ({ userName, names }) => {
  const { result } = await this.find({
    filter: {
      author: userName || { $in: names },
      'wobjects.object_type': { $in: [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK, OBJECT_TYPES.RECIPE] },
    },
    projection: { wobjects: 1 },
  });

  const linksArray = [];
  for (const resultElement of result) {
    linksArray.push(
      ...resultElement.wobjects
        .filter(
          (wobject) => _.includes(
            [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK, OBJECT_TYPES.RECIPE],
            wobject.object_type,
          ),
        )
        .map((wobject) => wobject.author_permlink),
    );
  }
  return linksArray;
};

exports.getFavoritesLinksFromPosts = async ({ userName }) => {
  const { result } = await this.find({
    filter: {
      author: userName,
      'wobjects.object_type': { $in: FAVORITES_OBJECT_TYPES },
    },
    projection: { wobjects: 1 },
  });

  const linksArray = [];
  for (const resultElement of result) {
    linksArray.push(
      ...resultElement.wobjects
        .filter(
          (wobject) => _.includes(
            FAVORITES_OBJECT_TYPES,
            wobject.object_type,
          ),
        )
        .map((wobject) => wobject.author_permlink),
    );
  }
  return _.uniq(linksArray);
};

exports.findOneFirstByAuthor = async ({ author }) => {
  try {
    return {
      result: await PostModel.findOne({ author }, {}, { sort: { createdAt: 1 } }).lean(),
    };
  } catch (error) {
    return { error };
  }
};

const getBlockedAppCond = () => {
  try {
    const store = asyncLocalStorage.getStore();
    const host = store.get('host');
    return { blocked_for_apps: { $ne: host } };
  } catch (error) {
    return {};
  }
};
