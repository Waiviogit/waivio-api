const {
  User, Post, App, Subscriptions, wobjectSubscriptions, hiddenPostModel, mutedUserModel, Wobj,
} = require('models');
const { getNamespace } = require('cls-hooked');
const { OBJECT_TYPES, REMOVE_OBJ_STATUSES, FIELDS_NAMES } = require('constants/wobjectsData');
const _ = require('lodash');
const queryHelper = require('utilities/helpers/queryHelper');
const { postHelper } = require('../../helpers');
const wobjectHelper = require('../../helpers/wObjectHelper');
const {
  getPostCacheKey,
  getCachedPosts,
  setCachedPosts,
} = require('../../helpers/postHelper');
const { fillPostsSubscriptions } = require('../../helpers/subscriptionHelper');

const getFeedObjectsConditions = async ({ links, app, locale }) => {
  if (_.isEmpty(links)) return;
  const { result } = await Wobj.find({
    author_permlink: { $in: links },
    object_type: OBJECT_TYPES.NEWS_FEED,
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  });
  if (_.isEmpty(result)) return;

  const processedObjects = await wobjectHelper.processWobjects({
    wobjects: result,
    fields: [FIELDS_NAMES.NEWS_FEED],
    app,
    locale,
    returnArray: true,
  });
  const conditions = [];

  for (const processedObject of processedObjects) {
    const newsPermlink = _.get(processedObject, 'newsFeed.permlink');
    if (!newsPermlink) continue;
    const wObject = _.find(result, (r) => r.author_permlink === processedObject.author_permlink);
    if (!wObject) continue;
    const { condition, error } = queryHelper.getNewsFilterCondition({
      wObject,
      app,
      condition: {},
      newsPermlink,
    });
    if (error) continue;
    if (!_.isEmpty(condition)) conditions.push(condition);
  }
  return conditions;
};

const getFeed = async ({
  // eslint-disable-next-line camelcase
  name, limit = 20, skip = 0, user_languages, filter = {}, forApp, lastId, userName, locale, app,
}) => {
  // const cacheKey = getPostCacheKey({
  //   skip, limit, user_languages, userName, method: 'getFeed',
  // });
  //
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
  const { wobjects: wobjectsSubscribed } = wobjectSubscriptionsDb;
  const { hiddenPosts = [] } = hiddenPostDb;
  const { result: muted = [] } = mutedUserDb;

  if (!user) {
    return { error: { status: 404, message: 'User not found!' } };
  }
  const { data: filtersData, error: filterError } = await getFiltersData({
    ...filter, forApp, lastId,
  });

  if (filterError) return { error: filterError };

  const feedObjectsConditions = await getFeedObjectsConditions(
    { links: wobjectsSubscribed, app, locale },
  );

  ({ posts } = await Post.getByFollowLists({
    skip,
    users,
    limit,
    filtersData,
    hiddenPosts,
    user_languages,
    author_permlinks: wobjectsSubscribed,
    muted: _.map(muted, 'userName'),
    feedObjectsConditions,
  }));

  posts = await postHelper.fillAdditionalInfo({ posts, userName });
  await wobjectHelper.moderatePosts({ posts, locale, app });
  await fillPostsSubscriptions({ posts, userName });

  // await setCachedPosts({ key: cacheKey, posts, ttl: 60 * 30 });
  return { posts };
};

const getFiltersData = async (filter) => {
  const data = {};
  const byApp = _.get(filter, 'byApp');
  const session = getNamespace('request-session');
  const host = session.get('host');
  if (_.isString(byApp) && !_.isEmpty(byApp)) {
    const { result: app, error } = await App.findOne({ host });

    if (error) return { error };
    // for filtering posts by specified list of wobjects
    data.require_wobjects = _.get(app, 'supported_objects', []);
  }
  // for moderate posts by admin of this apps
  data.forApp = filter.forApp;
  data.lastId = filter.lastId;

  return { data };
};

module.exports = getFeed;
