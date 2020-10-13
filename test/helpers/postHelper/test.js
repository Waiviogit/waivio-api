const _ = require('lodash');
const {
  faker, dropDatabase, postHelper, expect, moment, sinon,
} = require('test/testHelper');
const {
  CampaignFactory, BotUpvoteFactory, PostFactory, PaymentHistoryFactory,
} = require('test/factories');
const { RESERVATION_STATUSES } = require('constants/campaignsData');

describe('on additionalSponsorObligations', async () => {
  let reward, campaign, post, rewardOnPost, result, registeredVotes;
  const cashoutTime = moment().add(_.random(1, 10), 'days').toISOString();
  const reservationPermlink = faker.random.string();
  const reviewPermlink = faker.random.string();
  const guideName = faker.random.string();
  const userName = faker.random.string();
  const users = [{
    name: userName,
    status: _.sample(Object.values(_.omit(RESERVATION_STATUSES, ['REJECTED']))),
    object_permlink: faker.random.string(),
    hiveCurrency: 1,
    permlink: reservationPermlink,
  }];

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
        (a, b) => a + parseInt(b.rshares, 10), 0) / (reward * 100);
      campaign = await CampaignFactory.Create({ reward, users, guideName });
      post = await PostFactory.Create({
        cashout_time: cashoutTime,
        additionsForMetadata: { campaignId: campaign._id },
        pending_payout_value: rewardOnPost.toString(),
        active_votes: activeVotes,
        permlink: reviewPermlink,
        author: userName,
        onlyData: true,
      });
      await PaymentHistoryFactory.Create({
        permlink: reservationPermlink,
        sponsor: campaign.guideName,
        reviewPermlink,
        userName,
      });
      registeredVotes = _.slice(activeVotes, 0, _.random(1, activeVotes.length));
      for (const arg of registeredVotes) {
        await BotUpvoteFactory.Create({
          permlink: post.permlink,
          bot_name: arg.voter,
          author: post.author,
        });
      }
    });

    it('should display result greater or equal reward (greater, because there are others, not registred votes)', async () => {
      [post] = await postHelper.additionalSponsorObligations([post]);
      result = Math.round(parseFloat(post.pending_payout_value));
      expect(result).to.be.gte(reward);
    });
    it('additional obligations should be in active_votes array with flag sponsor true', async () => {
      [post] = await postHelper.additionalSponsorObligations([post]);
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide.voter).to.be.eq(campaign.guideName);
    });
    it('registered votes and sponsor vote should be equal reward ', async () => {
      [post] = await postHelper.additionalSponsorObligations([post]);
      let likedSum = 0;
      const voteRshares = _.reduce(post.active_votes,
        (a, b) => a + parseInt(b.rshares, 10), 0);
      const ratio = parseFloat(post.pending_payout_value) / voteRshares;
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      registeredVotes.push(guide);
      for (const el of registeredVotes) {
        likedSum += (ratio * (el.rshares_weight || el.rshares));
      }
      expect(Math.round(likedSum)).to.be.eq(reward);
    });
    it('should change sponsor record if it is in active votes result must be same', async () => {
      post.active_votes.push({
        voter: guideName,
        rshares: _.random(90, 99),
      });
      [post] = await postHelper.additionalSponsorObligations([post]);
      let likedSum = 0;
      const voteRshares = _.reduce(post.active_votes,
        (a, b) => a + parseInt(b.rshares, 10), 0);
      const ratio = parseFloat(post.pending_payout_value) / voteRshares;
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
      campaign = await CampaignFactory.Create({ reward, users });
      post = await PostFactory.Create({
        cashout_time: cashoutTime,
        additionsForMetadata: { campaignId: campaign._id },
        active_votes: activeVotes,
        pending_payout_value: '0',
        permlink: reviewPermlink,
        author: userName,
        onlyData: true,
      });
      await PaymentHistoryFactory.Create({
        permlink: reservationPermlink,
        sponsor: campaign.guideName,
        reviewPermlink,
        userName,
      });
    });
    it('sponsor_payout_value should be equal reward ', async () => {
      [post] = await postHelper.additionalSponsorObligations([post]);
      expect(Number(post.pending_payout_value)).to.be.eq(reward);
    });
    it('additional obligations should be in active_votes array with flag sponsor true', async () => {
      [post] = await postHelper.additionalSponsorObligations([post]);
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide.voter).to.be.eq(campaign.guideName);
    });
    it('sponsor rshares should be full reward', async () => {
      [post] = await postHelper.additionalSponsorObligations([post]);
      const voteRshares = _.reduce(post.active_votes,
        (a, b) => a + parseInt(b.rshares, 10), 0);
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      const guideHBD = (Number(post.pending_payout_value)
        / voteRshares) * guide.rshares;
      expect(Math.round(guideHBD)).to.be.eq(reward);
    });
    it('should change sponsor record if it is in active votes result must be same', async () => {
      post.active_votes.push({
        voter: guideName,
        rshares: _.random(90, 99),
      });
      [post] = await postHelper.additionalSponsorObligations([post]);
      const voteRshares = _.reduce(post.active_votes,
        (a, b) => a + parseInt(b.rshares, 10), 0);
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      const guideHBD = (Number(post.pending_payout_value)
        / voteRshares) * guide.rshares;
      expect(Math.round(guideHBD)).to.be.eq(reward);
    });
  });
  describe('When no active votes', async () => {
    beforeEach(async () => {
      await dropDatabase();
      reward = _.random(1, 10);
      campaign = await CampaignFactory.Create({ reward, users });
      post = await PostFactory.Create({
        additionsForMetadata: { campaignId: campaign._id },
        cashout_time: cashoutTime,
        pending_payout_value: '0',
        permlink: reviewPermlink,
        active_votes: [],
        author: userName,
        onlyData: true,
      });
      await PaymentHistoryFactory.Create({
        permlink: reservationPermlink,
        sponsor: campaign.guideName,
        reviewPermlink,
        userName,
      });
      [post] = await postHelper.additionalSponsorObligations([post]);
    });
    it('sponsor_payout_value should be equal reward ', async () => {
      expect(Number(post.pending_payout_value)).to.be.eq(reward);
    });
    it('additional obligations should be in active_votes array with flag sponsor true', async () => {
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide.voter).to.be.eq(campaign.guideName);
    });
    it('sponsor rshares should be full reward', async () => {
      const guideHBD = (Number(post.pending_payout_value)
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
        (a, b) => a + parseInt(b.rshares, 10), 0) / (reward * 10);
      campaign = await CampaignFactory.Create({ reward, users });
      post = await PostFactory.Create({
        onlyData: true,
        additionsForMetadata: { campaignId: campaign._id },
        active_votes: activeVotes,
        pending_payout_value: rewardOnPost.toString(),
        cashout_time: cashoutTime,
        permlink: reviewPermlink,
        author: userName,
      });
      await PaymentHistoryFactory.Create({
        permlink: reservationPermlink,
        sponsor: campaign.guideName,
        reviewPermlink,
        userName,
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
    it('sponsor should not be in active_votes array ', async () => {
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide).to.be.undefined;
    });
    it('pending_payout_value should be greater than reward', async () => {
      expect(parseFloat(post.pending_payout_value)).to.be.gt(reward);
    });
  });
  describe('When the cashout_time has passed', async () => {
    beforeEach(async () => {
      await dropDatabase();
      reward = _.random(1, 10);
      campaign = await CampaignFactory.Create({ reward, users });
      post = await PostFactory.Create({
        cashout_time: moment().subtract(_.random(1, 10), 'days').toISOString(),
        additionsForMetadata: { campaignId: campaign._id },
        curator_payout_value: '0',
        pending_payout_value: '0',
        permlink: reviewPermlink,
        author: userName,
        active_votes: [],
        onlyData: true,
      });
      await PaymentHistoryFactory.Create({
        permlink: reservationPermlink,
        sponsor: campaign.guideName,
        reviewPermlink,
        userName,
      });
      [post] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should write sponsor obligations in curator_payout_value', async () => {
      expect(parseFloat(_.get(post, 'curator_payout_value'))).to.be.eq(reward);
    });
  });
  describe('When the cashout_time has not passed', async () => {
    beforeEach(async () => {
      await dropDatabase();
      reward = _.random(1, 10);
      campaign = await CampaignFactory.Create({ reward, users });
      post = await PostFactory.Create({
        cashout_time: moment().add(_.random(1, 10), 'days').toISOString(),
        additionsForMetadata: { campaignId: campaign._id },
        pending_payout_value: '0',
        curator_payout_value: '0',
        permlink: reviewPermlink,
        author: userName,
        active_votes: [],
        onlyData: true,
      });
      await PaymentHistoryFactory.Create({
        permlink: reservationPermlink,
        sponsor: campaign.guideName,
        reviewPermlink,
        userName,
      });
      [post] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should write sponsor obligations in curator_payout_value', async () => {
      expect(parseFloat(_.get(post, 'pending_payout_value'))).to.be.eq(reward);
    });
  });
  describe('When no campaign id in metadata', async () => {
    let handledPost;
    beforeEach(async () => {
      await dropDatabase();
      post = await PostFactory.Create({ onlyData: true });
      [handledPost] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should return post from method and not attract post', async () => {
      expect(handledPost).to.be.deep.eq(post);
    });
  });

  describe('When cant find campaign by campaign id in metadata', async () => {
    let handledPost;
    beforeEach(async () => {
      await dropDatabase();
      post = await PostFactory.Create({
        onlyData: true,
        additionsForMetadata: { campaignId: faker.random.string() },
      });
      [handledPost] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should return post from method and not attract post', async () => {
      expect(handledPost).to.be.deep.eq(post);
    });
  });
  describe('when review rejected', async () => {
    let handledPost;
    beforeEach(async () => {
      await dropDatabase();
      const rejected = [...users];
      rejected[0].status = RESERVATION_STATUSES.REJECTED;
      reward = _.random(1, 10);
      campaign = await CampaignFactory.Create({ reward, users: rejected });
      post = await PostFactory.Create({
        cashout_time: moment().subtract(_.random(1, 10), 'days').toISOString(),
        additionsForMetadata: { campaignId: campaign._id },
        permlink: reviewPermlink,
        author: userName,
        onlyData: true,
      });
      await PaymentHistoryFactory.Create({
        permlink: reservationPermlink,
        sponsor: campaign.guideName,
        reviewPermlink,
        userName,
      });
      [handledPost] = await postHelper.additionalSponsorObligations([post]);
    });
    it('should return post from method and not attract post', async () => {
      expect(handledPost).to.be.deep.eq(post);
    });
  });
});
