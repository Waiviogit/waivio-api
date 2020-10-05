const _ = require('lodash');
const {
  faker, dropDatabase, postHelper, expect,
} = require('test/testHelper');
const { CampaignFactory, BotUpvoteFactory, PostFactory } = require('test/factories');

describe('on additionalSponsorObligations', async () => {
  let reward, campaign, post, rewardOnPost, result, registeredVotes;
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
      rewardOnPost = _.reduce(activeVotes,
        (a, b) => a + parseFloat(b.rshares_weight || b.rshares), 0) / (reward * 100);
      campaign = await CampaignFactory.Create({ reward });
      post = await PostFactory.Create({
        onlyData: true,
        additionsForMetadata: { campaignId: campaign._id },
        active_votes: activeVotes,
        pending_payout_value: rewardOnPost.toString(),
      });
      registeredVotes = _.slice(activeVotes, 0, _.random(1, activeVotes.length));
      for (const arg of registeredVotes) {
        await BotUpvoteFactory.Create({
          bot_name: arg.voter,
          author: post.author,
          permlink: post.permlink,
        });
      }
      [post] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should exist property sponsor_payout_value', async () => {
      expect(post.sponsor_payout_value).to.exist;
    });
    it('should display result greater or equal reward (greater, because there are others, not registred votes)', async () => {
      result = Math.round(Number(post.pending_payout_value) + Number(post.sponsor_payout_value));
      expect(result).to.be.gte(reward);
    });
    it('additional obligations should be in active_votes array with flag sponsor true', async () => {
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide.voter).to.be.eq(campaign.guideName);
    });
    it('registered votes and sponsor vote should be equal reward ', async () => {
      let likedSum = 0;
      const voteRshares = _.reduce(post.active_votes,
        (a, b) => a + parseFloat(b.rshares_weight || b.rshares), 0);
      const totalPayout = parseFloat(_.get(post, 'pending_payout_value', 0))
        + parseFloat(_.get(post, 'sponsor_payout_value', 0));
      const ratio = totalPayout / voteRshares;
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      registeredVotes.push(guide);
      for (const el of registeredVotes) {
        likedSum += (ratio * (el.rshares_weight || el.rshares));
      }
      expect(Math.round(likedSum)).to.be.eq(reward);
    });
  });
  describe('When post downvoted', async () => {
    beforeEach(async () => {
      await dropDatabase();
      const activeVotes = [];
      reward = _.random(1, 10);
      for (let i = 0; i < reward; i++) {
        activeVotes.push({
          voter: faker.name.firstName(),
          rshares: _.random(-90, -99),
        });
      }
      campaign = await CampaignFactory.Create({ reward });
      post = await PostFactory.Create({
        onlyData: true,
        additionsForMetadata: { campaignId: campaign._id },
        active_votes: activeVotes,
        pending_payout_value: '0',
      });
      [post] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should exist property sponsor_payout_value', async () => {
      expect(post.sponsor_payout_value).to.exist;
    });
    it('sponsor_payout_value should be equal reward ', async () => {
      expect(Number(post.sponsor_payout_value)).to.be.eq(reward);
    });
    it('additional obligations should be in active_votes array with flag sponsor true', async () => {
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide.voter).to.be.eq(campaign.guideName);
    });
    it('sponsor rshares should be full reward', async () => {
      const voteRshares = _.reduce(post.active_votes,
        (a, b) => a + parseFloat(b.rshares_weight || b.rshares), 0);
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      const guideHBD = (Number(post.sponsor_payout_value)
        / voteRshares) * guide.rshares;
      expect(Math.round(guideHBD)).to.be.eq(reward);
    });
  });
  describe('When no active votes', async () => {
    beforeEach(async () => {
      await dropDatabase();
      reward = _.random(1, 10);
      campaign = await CampaignFactory.Create({ reward });
      post = await PostFactory.Create({
        onlyData: true,
        additionsForMetadata: { campaignId: campaign._id },
        active_votes: [],
        pending_payout_value: '0',
      });
      [post] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should exist property sponsor_payout_value', async () => {
      expect(post.sponsor_payout_value).to.exist;
    });
    it('sponsor_payout_value should be equal reward ', async () => {
      expect(Number(post.sponsor_payout_value)).to.be.eq(reward);
    });
    it('additional obligations should be in active_votes array with flag sponsor true', async () => {
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide.voter).to.be.eq(campaign.guideName);
    });
    it('sponsor rshares should be full reward', async () => {
      const guideHBD = (Number(post.sponsor_payout_value)
        / post.active_votes[0].rshares) * post.active_votes[0].rshares;
      expect(Math.round(guideHBD)).to.be.eq(reward);
    });
  });
  describe('when post overliked', async () => {
    beforeEach(async () => {
      await dropDatabase();
      const activeVotes = [];
      reward = _.random(1, 10);
      for (let i = 0; i < reward; i++) {
        activeVotes.push({
          voter: faker.name.firstName(),
          rshares: _.random(110, 120),
        });
      }
      rewardOnPost = _.reduce(activeVotes,
        (a, b) => a + parseFloat(b.rshares_weight || b.rshares), 0) / (reward * 10);
      campaign = await CampaignFactory.Create({ reward });
      post = await PostFactory.Create({
        onlyData: true,
        additionsForMetadata: { campaignId: campaign._id },
        active_votes: activeVotes,
        pending_payout_value: rewardOnPost.toString(),
      });
      for (const arg of activeVotes) {
        await BotUpvoteFactory.Create({
          bot_name: arg.voter,
          author: post.author,
          permlink: post.permlink,
        });
      }
      [post] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should not exist property sponsor_payout_value', async () => {
      expect(post.sponsor_payout_value).to.not.exist;
    });
    it('sponsor should not be in active_votes array ', async () => {
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide).to.be.undefined;
    });
  });
});
