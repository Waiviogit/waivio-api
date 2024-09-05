const { CampaignPosts, faker } = require('test/testHelper');

const Create = async ({
  author, permlink, onlyData,
} = {}) => {
  const postData = {
    author: author || faker.name.firstName(),
    permlink: permlink || faker.name.firstName(),
  };
  if (onlyData) return postData;
  const subscription = new CampaignPosts(postData);
  await subscription.save();
  subscription.toObject();

  return subscription;
};

module.exports = { Create };
