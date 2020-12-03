const _ = require('lodash');
const { HiddenPost } = require('database').models;

exports.getHiddenPosts = async (userName) => {
  try {
    const hiddenPosts = await HiddenPost.find({ userName }).select(['-_id', '-userName']).lean();
    return { hiddenPosts: _.map(hiddenPosts, (el) => el.postId) };
  } catch (error) {
    return { error };
  }
};
