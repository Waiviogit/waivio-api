const {
  CommentRef, Wobj, User, Post: PostRepository, Subscriptions,
} = require('models');
const { Post } = require('database').models;
const { postsUtil } = require('utilities/steemApi');
const _ = require('lodash');
const { REQUIREDFIELDS_POST } = require('utilities/constants');

/**
 * Get wobjects data for particular post
 * @param author {String}
 * @param permlink {String}
 * @returns {Promise<{wObjectsData: *, wobjectPercents: *}>}
 * wObjectsData - full wobjects info(fields, def.name, posts counts etc.),
 * wobjectPercent - author_permlinks with percent which author noticed on particular post
 */
const getPostObjects = async (author = '', permlink = '') => {
  const { commentRef } = await CommentRef.getRef(`${author}_${permlink}`);

  if (_.isString(_.get(commentRef, 'wobjects'))) {
    let wobjs;

    try {
      wobjs = JSON.parse(commentRef.wobjects);
    } catch (e) {
      console.log(e);
    }
    if (Array.isArray(wobjs) && !_.isEmpty(wobjs)) {
      const { result: wObjectsData } = await Wobj.find(
        { author_permlink: { $in: _.map(wobjs, 'author_permlink') } }, {
          fields: 1, author_permlink: 1, weight: 1, object_type: 1, default_name: 1, parent: 1,
        },
      );
      wObjectsData.forEach((wobj) => {
        wobj.fields = wobj.fields.filter((field) => _.includes(REQUIREDFIELDS_POST, field.name));
      });
      return { wObjectsData, wobjectPercents: wobjs };
    }
  }
};

const getPostsByCategory = async (data) => {
  const { posts, error } = await postsUtil.getPostsByCategory(data);

  if (error) {
    return { error };
  }
  if (!posts || posts.error) {
    return { error: { status: 404, message: _.get(posts, 'error.message', 'Posts not found') } };
  }
  if (!posts.length) return { posts: [] };
  // get posts array by authors and permlinks
  const { posts: dbPosts, error: postsDbError } = await PostRepository.getManyPosts(
    posts.map((p) => (_.pick(p, ['author', 'permlink']))),
  );
  if (postsDbError) {
    return { error: postsDbError };
  }

  await Promise.all(posts.map(async (post) => {
    if (post && post.author && post.permlink) {
      const dbPost = dbPosts.find((p) => p.author === post.author && p.permlink === post.permlink);
      post = await mergePostData(post, dbPost);
    }
  }));
  return { posts };
};

/**
 * Get post from DB and merge fields which doesn't exists in source post(from steem)
 * @param postSteem
 * @param postDb *optional*
 * @returns {Promise<{error: *}|*>}
 */
const mergePostData = async (postSteem, postDb) => {
  if (!postDb) {
    if (!postSteem) return;
    const { post: dbPost, error } = await PostRepository.getOne({
      root_author: _.get(postSteem, 'root_author', postSteem.author),
      permlink: postSteem.permlink,
    });

    if (error || !dbPost) return postSteem;
    postDb = dbPost;
  }
  const diffKeys = _.difference(Object.keys(postDb || {}), Object.keys(postSteem));

  diffKeys.forEach((key) => {
    postSteem[key] = postDb[key];
  });
  // fill active_votes in case votes from guest users
  postDb.active_votes.forEach((dbVote) => {
    if (!postSteem.active_votes.find((v) => v.voter === dbVote.voter)) {
      postSteem.active_votes.push(dbVote);
    }
  });

  return postSteem;
};

// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async (authorPermlink) => {
  const { wObject, error } = await Wobj.getOne(authorPermlink);

  if (error) {
    return { error };
  } if (!wObject.newsFilter) {
    return { condition: { $match: { 'wobjects.author_permlink': authorPermlink } } };
  }
  const { newsFilter } = wObject;

  if (!newsFilter.allowList && !newsFilter.ignoreList) {
    return { error: { message: 'Format not exist all require fields' } };
  }
  let firstCond;

  if (Array.isArray(newsFilter.allowList)
      && !_.isEmpty(newsFilter.allowList)
      && _.some(newsFilter.allowList, (rule) => Array.isArray(rule) && rule.length)) {
    const orCondArr = [{ 'wobjects.author_permlink': authorPermlink }];

    newsFilter.allowList.forEach((allowRule) => {
      if (Array.isArray(allowRule) && allowRule.length) {
        orCondArr.push(
          {
            'wobjects.author_permlink': {
              $all: allowRule,
            },
          },
        );
      }
    });
    firstCond = { $or: orCondArr };
  } else {
    firstCond = { 'wobjects.author_permlink': authorPermlink };
  }
  const secondCond = {
    'wobjects.author_permlink': {
      $nin: Array.isArray(newsFilter.ignoreList) ? newsFilter.ignoreList : [],
    },
  };

  return { condition: { $match: { $and: [firstCond, secondCond] } } };
};

const addAuthorWobjectsWeight = async (posts = []) => {
  const names = posts.map((p) => p.author);
  const { result: users, error } = await User.aggregate([
    { $match: { name: { $in: names } } }, { $project: { name: 1, wobjects_weight: 1 } }]);

  if (error || !users) {
    console.error(error || 'Get Users wobjects_weight no result!');
    return;
  }
  posts.forEach((post) => {
    const reputation = _.get(users.find((user) => user.name === post.author), 'wobjects_weight');
    post.author_wobjects_weight = reputation;
    post.author_reputation = reputation;
  });
};

const fillReblogs = async (posts = [], userName) => {
// const fillReblogs = async (posts = []) => {
  for (const postIdx in posts) {
    if (_.get(posts, `[${postIdx}].reblog_to.author`) && _.get(posts, `[${postIdx}].reblog_to.permlink`)) {
      let sourcePost;

      try {
        const author = _.get(posts, `[${postIdx}].reblog_to.author`);
        const permlink = _.get(posts, `[${postIdx}].reblog_to.permlink`);
        sourcePost = await Post
          .findOne({
            $or: [{ author, permlink }, { root_author: author, permlink }],
          })
          .populate({ path: 'fullObjects', select: '-latest_posts -last_posts_counts_by_hours' })
          .lean();
      } catch (error) {
        console.error(error);
      }
      let subscription;
      if (userName) {
        ({ subscription } = await Subscriptions
          .findOne({ follower: userName, following: posts[postIdx].author }));
      }
      if (sourcePost) {
        posts[postIdx] = {
          ...sourcePost,
          reblogged_by: posts[postIdx].author,
          checkForFollow: {
            name: posts[postIdx].author,
            youFollows: !!subscription,
          },
        };
      }
    }
  }
};

module.exports = {
  getPostObjects,
  getPostsByCategory,
  getWobjFeedCondition,
  addAuthorWobjectsWeight,
  fillReblogs,
  mergePostData,
};
