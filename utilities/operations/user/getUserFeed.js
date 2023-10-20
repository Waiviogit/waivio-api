const {
  User, Post, App, Subscriptions, wobjectSubscriptions, hiddenPostModel, mutedUserModel,
} = require('models');
const { getNamespace } = require('cls-hooked');
const _ = require('lodash');
const { postHelper } = require('../../helpers');
const wobjectHelper = require('../../helpers/wObjectHelper');
const {
  getPostCacheKey,
  getCachedPosts,
  setCachedPosts,
} = require('../../helpers/postHelper');
const { fillPostsSubscriptions } = require('../../helpers/subscriptionHelper');

const getFeed = async ({
  // eslint-disable-next-line camelcase
  name, limit = 20, skip = 0, user_languages, userName, locale, app,
}) => {
  const cacheKey = getPostCacheKey({
    skip, limit, user_languages, userName, method: 'getFeed',
  });

  // const cache = await getCachedPosts(cacheKey);
  // if (cache) return { posts: cache };

  let posts = [];
  const requestsMongo = await Promise.all([
    User.getOne(name),
    Subscriptions.getFollowings({ follower: name, limit: 0 }),
    wobjectSubscriptions.getFollowings({ follower: name }),
    hiddenPostModel.getHiddenPosts(userName),
    mutedUserModel.find({ condition: { mutedBy: userName } }),
  ]);

  for (const request of requestsMongo) {
    if (_.has(request, 'error')) {
      return { error: { status: 404, message: 'User not found!' } };
    }
  }
  const [userDb, SubscriptionsDb, wobjectSubscriptionsDb, hiddenPostDb, mutedUserDb] = requestsMongo;
  const { user } = userDb;
  const { users } = SubscriptionsDb;
  const { wobjects } = wobjectSubscriptionsDb;
  const { hiddenPosts = [] } = hiddenPostDb;
  const { result: muted = [] } = mutedUserDb;

  if (!user) {
    return { error: { status: 404, message: 'User not found!' } };
  }

  ({ posts } = await Post.getByFollowLists({
    skip,
    users,
    limit,
    hiddenPosts,
    user_languages,
    author_permlinks: wobjects,
    muted: _.map(muted, 'userName'),
  }));

  for (const post of posts) {
    post.fullObjects = _.take(post.fullObjects, 4);
  }

  console.time('PostProcess');
  posts = await postHelper.fillAdditionalInfo({ posts, userName });

  await Promise.all([
    wobjectHelper.moderatePosts({ posts, locale, app }),
    fillPostsSubscriptions({ posts, userName }),
  ]);
  console.timeEnd('PostProcess');

  await setCachedPosts({ key: cacheKey, posts, ttl: 60 * 30 });
  return { posts };
};

module.exports = getFeed;
