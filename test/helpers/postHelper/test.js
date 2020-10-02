const _ = require('lodash');
const {
  faker, dropDatabase, postHelper, expect,
} = require('test/testHelper');
const { CampaignFactory, BotUpvoteFactory, PostFactory } = require('test/factories');

describe('on additionalSponsorObligations', async () => {
  let reward, campaign, guideName, post, rewardOnPost, result;
  describe('when there are no downvotes on post', async () => {
    beforeEach(async () => {
      await dropDatabase();
      const activeVotes = [];
      for (let i = 0; i < _.random(2, 10); i++) {
        activeVotes.push({
          voter: faker.name.firstName(),
          rshares: _.random(10000, 1000000),
        });
      }
      guideName = faker.name.firstName();
      reward = _.random(1, 100);
      rewardOnPost = _.random(0, reward);
      campaign = await CampaignFactory.Create({ reward, guideName });
      post = await PostFactory.Create({
        onlyData: true,
        additionsForMetadata: { campaignId: campaign._id },
        active_votes: activeVotes,
        pending_payout_value: rewardOnPost,
      });
      const registeredVotes = _.slice(activeVotes, 0, _.random(1, activeVotes.length));
      for (const arg of registeredVotes) {
        await BotUpvoteFactory.Create({
          bot_name: arg.voter,
          author: post.author,
          permlink: post.permlink,
        });
      }
      [post] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should ', async () => {
      result = +post.pending_payout_value + post.sponsor_payout_value;
      expect(result).to.be.eq(reward);
    });
  });
});
