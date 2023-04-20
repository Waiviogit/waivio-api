const _ = require('lodash');
const { Subscriptions } = require('../../models');
const { getFollowingsArray } = require('../operations/user/getFollowingsUser');

const fillPostsSubscriptions = async ({ posts, userName }) => {
  const names = _.map(posts, (follower) => follower.author);

  const { subscriptionData } = await Subscriptions
    .find({ condition: { follower: { $in: names }, following: userName } });

  _.forEach(posts, (follower) => {
    follower.followsYou = !!_.find(subscriptionData, (el) => el.follower === follower.name);
  });
  const names2 = _.map(posts, (following) => following.author);
  const { users, error } = await getFollowingsArray(
    { name: userName, users: names2 },
  );
  if (error) return;

  _.forEach(posts, (following) => {
    const result = _.find(users, (user) => Object.keys(user)[0] === following.author);

    following.youFollows = !!result && result[following.author];
  });
};

module.exports = {
  fillPostsSubscriptions,
};
