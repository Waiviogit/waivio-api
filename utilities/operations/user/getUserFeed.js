const {
  User, Post, Subscriptions, wobjectSubscriptions, hiddenPostModel, mutedUserModel, App,
} = require('models');
const _ = require('lodash');
const { postHelper } = require('../../helpers');
const wobjectHelper = require('../../helpers/wObjectHelper');
const { fillPostsSubscriptions } = require('../../helpers/subscriptionHelper');
const asyncLocalStorage = require('../../../middlewares/context/context');

const getFeed = async ({
  // eslint-disable-next-line camelcase
  name, limit = 20, skip = 0, user_languages, filter = {}, forApp, lastId, userName, locale, app,
}) => {
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

  const { data: filtersData, error: filterError } = await getFiltersData({
    ...filter, forApp, lastId,
  });

  ({ posts } = await Post.getByFollowLists({
    skip,
    users,
    limit,
    filtersData,
    hiddenPosts,
    user_languages,
    author_permlinks: wobjects,
    muted: _.map(muted, 'userName'),
  }));

  posts = await postHelper.fillAdditionalInfo({ posts, userName });

  await Promise.all([
    wobjectHelper.moderatePosts({ posts, locale, app }),
    fillPostsSubscriptions({ posts, userName }),
  ]);

  return { posts };
};

const getFiltersData = async (filter) => {
  const data = {};
  const byApp = _.get(filter, 'byApp');
  const store = asyncLocalStorage.getStore();
  const host = store.get('host');
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
