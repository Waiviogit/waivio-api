const _ = require('lodash');
const { HiddenPost } = require('database').models;

exports.create = async (data) => {
  const hidePost = new HiddenPost(data);

  try {
    return { hidePost: await hidePost.save() };
  } catch (error) {
    return { error };
  }
};

exports.getHiddenPosts = async (userName) => {
  try {
    const hiddenPosts = await HiddenPost.find({ userName }).select(['-_id', '-userName']).lean();
    return { hiddenPosts: _.map(hiddenPosts, (el) => el.postId) };
  } catch (error) {
    return { error };
  }
};

// (async () => {
//   const userName = 'flowmaster';
//   const yo = await this.create({ userName, postId: '5cf72ccf9619f62183aec09a' });
//   console.log('yo');
// })();
