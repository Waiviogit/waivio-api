const { Hide } = require('database').models;

exports.create = async (data) => {
  const hidePost = new Hide(data);

  try {
    return { hidePost: await hidePost.save() };
  } catch (error) {
    return { error };
  }
};

exports.find = async (...names) => {
  try {
    const hidePosts = await Hide.find({ userName: { $in: names } }).select(['-_id', '-userName']).lean();
    return { hidePosts };
  } catch (error) {
    return { error };
  }
};

(async () => {
  const userName = 'flowmaster';
  const moderators = ['yo', 'common'];
  const owner = 'grampo';
  const yo = await this.find(userName, owner, ...moderators);
  console.log('yo');
})();
