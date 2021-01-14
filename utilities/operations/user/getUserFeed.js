const {
  User, Post, App, Subscriptions, wobjectSubscriptions, hiddenPostModel, mutedUserModel,
} = require('models');
const { getNamespace } = require('cls-hooked');
const _ = require('lodash');

const getFeed = async ({
  // eslint-disable-next-line camelcase
  name, limit = 20, skip = 0, user_languages, filter = {}, forApp, lastId, userName,
}) => {
  const { user, error: userError } = await User.getOne(name);
  const { users, error: subsError } = await Subscriptions
    .getFollowings({ follower: name, limit: 0 });
  const { wobjects = [] } = await wobjectSubscriptions.getFollowings({ follower: name });

  if (userError || subsError || !user) {
    return { error: userError || subsError || { status: 404, message: 'User not found!' } };
  }
  const { data: filtersData, error: filterError } = await getFiltersData({
    ...filter, forApp, lastId,
  });

  if (filterError) return { error: filterError };

  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(userName);
  const { result: muted = [] } = await mutedUserModel.find({ condition: { mutedBy: userName } });

  const { posts, error: postsError } = await Post.getByFollowLists({
    skip,
    users,
    limit,
    filtersData,
    hiddenPosts,
    user_languages,
    author_permlinks: wobjects,
    muted: _.map(muted, 'userName'),
  });

  if (postsError) return { error: postsError };

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
