const _ = require('lodash');
const { HiddenPost } = require('../database').models;

exports.getHiddenPosts = async (userName, sort = {}) => {
  try {
    const hiddenPosts = await HiddenPost.find({ userName }).select('postId').sort(sort).lean();
    return { hiddenPosts: _.map(hiddenPosts, (el) => el.postId) };
  } catch (error) {
    return { error };
  }
};
