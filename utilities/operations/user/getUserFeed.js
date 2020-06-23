const {
  User, Post, App, Subscriptions,
} = require('models');
const _ = require('lodash');

const getFeed = async ({
  // eslint-disable-next-line camelcase
  name, limit = 20, skip = 0, user_languages, filter = {}, forApp, lastId,
}) => {
  const { user, error: userError } = await User.getOne(name);
  const { users, error: subsError } = await Subscriptions
    .getFollowings({ follower: name, limit: -1 });

  if (userError || subsError || !user) {
    return { error: userError || subsError || { status: 404, message: 'User not found!' } };
  }
  const { data: filtersData, error: filterError } = await getFiltersData({
    ...filter, forApp, lastId,
  });

  if (filterError) return { error: filterError };

  const { posts, error: postsError } = await Post.getByFollowLists({
    users,
    author_permlinks: user.objects_follow,
    user_languages,
    skip,
    limit,
    filtersData,
  });

  if (postsError) return { error: postsError };

  return { posts };
};

const getFiltersData = async (filter) => {
  const data = {};
  const byApp = _.get(filter, 'byApp');

  if (_.isString(byApp) && !_.isEmpty(byApp)) {
    const { app, error } = await App.getOne({ name: byApp });

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
