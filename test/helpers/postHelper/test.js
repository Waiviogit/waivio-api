const _ = require('lodash');
const {
  faker, dropDatabase, postHelper, expect, moment,
} = require('test/testHelper');
const {
  CampaignFactory, BotUpvoteFactory, PostFactory, PaymentHistoryFactory, Campaign2Factory,
  UsersFactory, SubscriptionsFactory, CampaignPostFactory,
} = require('test/factories');
const { RESERVATION_STATUSES } = require('constants/campaignsData');

describe('on additionalSponsorObligations', async () => {
  let rewardInUSD, campaign, post, rewardOnPost, result, registeredVotes, payoutToken;
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
    reservationPermlink: faker.random.string(),
    objectPermlink: faker.random.string(),
  }];

  describe('when there are no downvotes on post', async () => {
    beforeEach(async () => {
      await dropDatabase();
      const activeVotes = [];
      payoutToken = 'WAIV';
      rewardInUSD = _.random(1, 10);
      for (let i = 0; i < rewardInUSD; i++) {
        activeVotes.push({
          voter: faker.name.firstName(),
          rshares: _.random(90, 99),
        });
      }
      rewardOnPost = _.reduce(
        activeVotes,
        (a, b) => a + parseInt(b.rshares, 10),
        0,
      ) / (rewardInUSD * 100);
      post = await PostFactory.Create({
        cashout_time: cashoutTime,
        pending_payout_value: rewardOnPost.toString(),
        active_votes: activeVotes,
        permlink: reviewPermlink,
        author: userName,
      });
      await CampaignPostFactory.Create(post);

      campaign = await Campaign2Factory.Create({
        rewardInUSD,
        users: [{
          name: userName,
          status: 'completed',
          object_permlink: faker.random.string(),
          hiveCurrency: 1,
          permlink: reservationPermlink,
          reservationPermlink: faker.random.string(),
          objectPermlink: faker.random.string(),
          reviewPermlink: post.permlink,
        }],
        guideName,
        payoutToken,
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
      expect(result).to.be.gte(rewardInUSD);
    });
    it('additional obligations should be in active_votes array with flag sponsor true', async () => {
      [post] = await postHelper.additionalSponsorObligations([post]);
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      expect(guide.voter).to.be.eq(campaign.guideName);
    });
    it('registered votes and sponsor vote should be equal reward ', async () => {
      [post] = await postHelper.additionalSponsorObligations([post]);
      let likedSum = 0;
      const voteRshares = _.reduce(
        post.active_votes,
        (a, b) => a + parseInt(b.rshares, 10),
        0,
      );
      const ratio = parseFloat(post.pending_payout_value) / voteRshares;
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      registeredVotes.push(guide);
      for (const el of registeredVotes) {
        likedSum += (ratio * el.rshares);
      }
      expect(parseInt(likedSum, 10)).to.be.eq(reward);
    });
    it('should change sponsor record if it is in active votes result must be same', async () => {
      post.active_votes.push({
        voter: guideName,
        rshares: _.random(90, 99),
      });
      [post] = await postHelper.additionalSponsorObligations([post]);
      let likedSum = 0;
      const voteRshares = _.reduce(
        post.active_votes,
        (a, b) => a + parseInt(b.rshares, 10),
        0,
      );
      const ratio = parseFloat(post.pending_payout_value) / voteRshares;
      const guide = _.find(post.active_votes, (v) => v.voter === campaign.guideName && !!v.sponsor);
      registeredVotes.push(guide);
      for (const el of registeredVotes) {
        likedSum += (ratio * (el.rshares_weight || el.rshares));
      }
      expect(parseInt(likedSum, 10)).to.be.eq(reward);
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
      const voteRshares = _.reduce(
        post.active_votes,
        (a, b) => a + parseInt(b.rshares, 10),
        0,
      );
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
      const voteRshares = _.reduce(
        post.active_votes,
        (a, b) => a + parseInt(b.rshares, 10),
        0,
      );
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
          rshares: _.random(200, 1500),
        });
      }
      rewardOnPost = _.reduce(
        activeVotes,
        (a, b) => a + parseInt(b.rshares, 10),
        0,
      ) / (reward * 10);
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
          author: post.root_author,
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
    it('should write sponsor obligations in total_payout_value', async () => {
      expect(parseFloat(_.get(post, 'total_payout_value'))).to.be.eq(reward);
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
    });
    it('should return post from method and not attract post', async () => {
      [handledPost] = await postHelper.additionalSponsorObligations([post]);
      expect(handledPost).to.be.deep.eq(post);
    });
  });
});
describe('on addAuthorWobjectsWeight', async () => {
  let post, author, wobjects_weight;
  beforeEach(async () => {
    await dropDatabase();
    author = faker.name.firstName();
    wobjects_weight = _.random(0, 10);
    await UsersFactory.Create({ name: author, wobjects_weight });
    post = await PostFactory.Create({ author });
  });
  describe('If author_wobjects_weight can be added', async () => {
    beforeEach(async () => {
      await postHelper.addAuthorWobjectsWeight([post]);
    });
    it('Should add a new field \'author_wobjects_weight\'', async () => {
      expect(post).to.have.own.property('author_wobjects_weight');
    });
    it('Should add correct value to the field \'author_wobjects_weight\'', async () => {
      expect(post.author_wobjects_weight).to.be.eq(wobjects_weight);
    });
  });
  it('Should not add a new field \'author_wobjects_weight\' if posts array is empty', async () => {
    post = await PostFactory.Create({});
    await postHelper.addAuthorWobjectsWeight([]);
    expect(post).not.to.have.own.property('author_wobjects_weight');
  });
});
describe('on fillReblogs', async () => {
  let post, rebloggedPost, follower, followerName, user, author, permlink, posts;
  describe('When post was reblogged', async () => {
    beforeEach(async () => {
      await dropDatabase();
      posts = [];
      author = faker.name.firstName();
      permlink = faker.random.string();
      followerName = faker.name.firstName();
      follower = await UsersFactory.Create({ name: followerName });
      user = await UsersFactory.Create({ name: author });
      await SubscriptionsFactory.Create({ name: follower.name, following: user.name });
      post = await PostFactory.Create({ author, permlink, reblogged: [follower.name] });
      rebloggedPost = await PostFactory.Create({
        author: followerName,
        permlink: `${post.author}/${post.permlink}`,
        parent_author: author,
        reblog_to: { author, permlink },
        rootAuthor: author,
      });
      posts.push(rebloggedPost, post);
      await postHelper.fillReblogs(posts, followerName);
    });
    it('Should add new field \'reblogged_by\'', async () => {
      expect(posts[0]).to.have.own.property('reblogged_by');
    });
    it('Should add correct username to \'reblogged_by\'', async () => {
      expect(posts[0].reblogged_by).to.be.eq(followerName);
    });
    it('Should return object with \'youFollows: true\' if post was reblogged by follower', async () => {
      expect(posts[0].checkForFollow).to.be.deep.eq({ name: followerName, youFollows: true });
    });
    it('Should return object with correct permlink', async () => {
      expect(posts[0].permlink).to.be.eq(post.permlink);
    });
  });
  describe('When post was not reblogged', async () => {
    beforeEach(async () => {
      await dropDatabase();
      posts = [];
      author = faker.name.firstName();
      permlink = faker.random.string();
      post = await PostFactory.Create({ author, permlink });
    });
    it('Should not add \'reblogged_by\' field to post', async () => {
      posts.push(post);
      await postHelper.fillReblogs(posts);
      expect(posts[0]).not.to.have.own.property('reblogged_by');
    });
  });
});
describe('On fillObjects', async () => {
  let post, author, permlink, posts;
  beforeEach(async () => {
    await dropDatabase();
    posts = [];
    author = faker.name.firstName();
    permlink = faker.random.string();
    await UsersFactory.Create({ name: author });
    post = await PostFactory.Create({
      author,
      permlink,
      wobjects: [
        {
          author_permlink: permlink,
        },
      ],
      fullObjects: { permlink },
    });
    post.wobjects[0] = Object.assign(post.wobjects[0], {
      object_type: faker.random.word(), weight: _.random(0, 5),
    });
  });
  it('Should return post.wobjects without changes if there were not add property \'campaign\' to post.wobjects', async () => {
    posts.push(post);
    await postHelper.fillObjects(posts, author);
    expect((posts[0].wobjects)).to.be.deep.eq(post.wobjects);
  });
  it('Should delete \'fullObjects\' field', async () => {
    posts.push(post);
    await postHelper.fillObjects(posts, author);
    expect(posts[0].fullObjects).to.be.not.exist;
  });
  it('Should clear post.wobjects if wobjects are not full', async () => {
    post = await PostFactory.Create({ author });
    posts.push([post]);
    await postHelper.fillObjects(posts, author);
    expect(_.isEmpty(posts[0].wobjects)).to.be.true;
  });
  describe('If \'addCampaignsToWobjects\' changes \'post.wobjects\'', async () => {
    let objects, requiredObject, reward, budget;
    beforeEach(async () => {
      await dropDatabase();
      posts = [];
      author = faker.name.firstName();
      permlink = faker.random.string();
      await UsersFactory.Create({ name: author });
      post = await PostFactory.Create({
        author,
        permlink,
        wobjects: [
          {
            author_permlink: permlink,
          },
        ],
        fullObjects: { permlink },
      });
      post.wobjects[0] = Object.assign(post.wobjects[0], {
        object_type: faker.random.word(), weight: _.random(0, 5),
      });
      objects = [permlink, faker.random.word(), faker.random.word(), faker.random.word()];
      requiredObject = permlink;
      reward = _.random(15, 100);
      budget = _.random(500, 1000);
      await CampaignFactory.Create({
        objects, requiredObject, status: 'active', reward, budget,
      });
    });
    it('Should add new property \'campaigns\' to post.wobjects', async () => {
      posts.push(post);
      await postHelper.fillObjects(posts, author);
      expect(posts[0].wobjects[0]).to.have.own.property('campaigns');
    });
    it('Should add correct value to \'campaigns\'', async () => {
      posts.push(post);
      await postHelper.fillObjects(posts, author);
      expect(posts[0].wobjects[0].campaigns).to.have.deep.eq({
        min_reward: reward, max_reward: reward,
      });
    });
  });
});
