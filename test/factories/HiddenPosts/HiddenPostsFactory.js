const { HiddenPost, faker } = require('test/testHelper');

const Create = async ({ userName, postId } = {}) => {
  const data = {
    userName: userName || faker.random.string(),
    postId: postId || faker.random.string(),
  };

  const hiddenPost = new HiddenPost(data);
  await hiddenPost.save();
  hiddenPost.toObject();

  return hiddenPost;
};

module.exports = { Create };
