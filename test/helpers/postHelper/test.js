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
      reward = _.random(1, 10);
      for (let i = 0; i < reward; i++) {
        activeVotes.push({
          voter: faker.name.firstName(),
          rshares: _.random(90, 99),
        });
      }
      guideName = faker.name.firstName();
      rewardOnPost = _.reduce(activeVotes,
        (a, b) => a + parseFloat(b.rshares_weight || b.rshares), 0) / (reward * 100);
      campaign = await CampaignFactory.Create({ reward, guideName });
      post = await PostFactory.Create({
        onlyData: true,
        additionsForMetadata: { campaignId: campaign._id },
        active_votes: activeVotes,
        pending_payout_value: rewardOnPost.toString(),
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
    it('should display result greater or equal reward (greater, becouse there are', async () => {
      result = Math.round(Number(post.pending_payout_value) + Number(post.sponsor_payout_value));
      expect(result).to.be.gte(reward);
    });
  });
});
