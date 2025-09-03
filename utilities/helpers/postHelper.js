const _ = require('lodash');
const {
  Wobj,
  User,
  Post: PostRepository,
  Subscriptions,
  paymentHistory,
  CampaignPosts,
  CampaignV2,
  SponsorsUpvote,
  blacklistModel,
  Campaign,
  botUpvoteModel,
} = require('../../models');
const { addCampaignsToWobjects } = require('./campaignsHelper');
const { Post } = require('../../database').models;
const { REQUIREDFIELDS_POST } = require('../../constants/wobjectsData');
const {
  RESERVATION_STATUSES,
  PAYMENT_HISTORIES_TYPES,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
} = require('../../constants/campaignsData');
const { getCurrentNames } = require('./wObjectHelper');
const {
  redis,
  redisGetter,
  redisSetter,
} = require('../redis');
const jsonHelper = require('./jsonHelper');
const currenciesRequests = require('../requests/currenciesRequests');
const crypto = require('node:crypto');
const BigNumber = require('bignumber.js');

/**
 * Get wobjects data for particular post
 * @param wobjects {[{}]}
 * @returns {Promise<{wObjectsData: *, wobjectPercents: *}>}
 * wObjectsData - full wobjects info(fields, def.name, posts counts etc.),
 * wobjectPercent - author_permlinks with percent which author noticed on particular post
 */
const getPostObjects = async (wobjects) => {
  if (Array.isArray(wobjects) && !_.isEmpty(wobjects)) {
    const { result: wObjectsData } = await Wobj.find({ author_permlink: { $in: _.map(wobjects, 'author_permlink') } }, {
      author: 1,
      authority: 1,
      fields: 1,
      author_permlink: 1,
      weight: 1,
      object_type: 1,
      default_name: 1,
      parent: 1,
      'status.title': 1,
    });
    wObjectsData.forEach((wobj) => {
      wobj.fields = wobj.fields.filter((field) => _.includes(REQUIREDFIELDS_POST, field.name));
    });
    return {
      wObjectsData,
      wobjectPercents: wobjects,
    };
  }
};

const getPostsByCategory = async (data) => PostRepository.getBlog({
  name: data.name,
  skip: data.skip,
  limit: data.limit,
});

/**
 * Get post from DB and merge fields which doesn't exists in source post(from steem)
 * @param postSteem
 * @param postDb *optional*
 * @returns {Promise<{error: *}|*>}
 */
const mergePostData = async (postSteem, postDb) => {
  if (!postDb) {
    if (!postSteem) return;
    const {
      post: dbPost,
      error,
    } = await PostRepository.getOne({
      root_author: _.get(postSteem, 'root_author', postSteem.author),
      permlink: postSteem.permlink,
    });

    if (error || !dbPost) return postSteem;
    postDb = dbPost;
  }
  const diffKeys = _.difference(Object.keys(postDb || {}), Object.keys(postSteem));

  diffKeys.forEach((key) => {
    postSteem[key] = postDb[key];
  });
  // strange behavior net_rshares on hive
  if (postSteem.net_rshares === 0) postSteem.net_rshares = postDb.net_rshares;
  // fill active_votes in case votes from guest users
  postDb.active_votes.forEach((dbVote) => {
    const hiveVote = _.find(postSteem.active_votes, (v) => v.voter === dbVote.voter);
    if (!hiveVote) {
      postSteem.active_votes.push(dbVote);
    }
    if (_.has(dbVote, 'rsharesWAIV') && hiveVote) {
      hiveVote.rsharesWAIV = dbVote.rsharesWAIV;
    }
  });

  return postSteem;
};

// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async (authorPermlink) => {
  const {
    wObject,
    error,
  } = await Wobj.getOne(authorPermlink);

  if (error) {
    return { error };
  }
  if (!wObject.newsFilter) {
    return { condition: { $match: { 'wobjects.author_permlink': authorPermlink } } };
  }
  const { newsFilter } = wObject;

  if (!newsFilter.allowList && !newsFilter.ignoreList) {
    return { error: { message: 'Format not exist all require fields' } };
  }
  let firstCond;

  if (Array.isArray(newsFilter.allowList)
    && !_.isEmpty(newsFilter.allowList)
    && _.some(newsFilter.allowList, (rule) => Array.isArray(rule) && rule.length)) {
    const orCondArr = [{ 'wobjects.author_permlink': authorPermlink }];

    newsFilter.allowList.forEach((allowRule) => {
      if (Array.isArray(allowRule) && allowRule.length) {
        orCondArr.push(
          {
            'wobjects.author_permlink': {
              $all: allowRule,
            },
          },
        );
      }
    });
    firstCond = { $or: orCondArr };
  } else {
    firstCond = { 'wobjects.author_permlink': authorPermlink };
  }
  const secondCond = {
    'wobjects.author_permlink': {
      $nin: Array.isArray(newsFilter.ignoreList) ? newsFilter.ignoreList : [],
    },
  };

  return { condition: { $match: { $and: [firstCond, secondCond] } } };
};

const addAuthorWobjectsWeight = async (posts = []) => {
  const names = posts.map((p) => p.author);
  const {
    result: users,
    error,
  } = await User.aggregate([
    { $match: { name: { $in: names } } }, {
      $project: {
        name: 1,
        wobjects_weight: 1,
      },
    }]);

  if (error || !users) {
    console.error('Get Users wobjects_weight no result!');
    return;
  }
  posts.forEach((post) => {
    const reputation = _.get(users.find((user) => user.name === post.author), 'wobjects_weight');
    post.author_wobjects_weight = reputation;
    post.author_reputation = reputation;
  });
};

const fillReblogs = async (posts = [], userName) => {
  for (const postIdx in posts) {
    if (_.get(posts, `[${postIdx}].reblog_to.author`) && _.get(posts, `[${postIdx}].reblog_to.permlink`)) {
      let sourcePost;

      try {
        const author = _.get(posts, `[${postIdx}].reblog_to.author`);
        const permlink = _.get(posts, `[${postIdx}].reblog_to.permlink`);
        sourcePost = await Post
          .findOne({
            $or: [{
              author,
              permlink,
            }, {
              root_author: author,
              permlink,
            }],
          })
          .populate({
            path: 'fullObjects',
            select: '-latest_posts -last_posts_counts_by_hours',
          })
          .lean();
      } catch (error) {
        console.error('fillReblogs Error');
      }
      let subscription;
      if (userName) {
        ({ subscription } = await Subscriptions
          .findOne({
            follower: userName,
            following: posts[postIdx].author,
          }));
      }
      if (sourcePost) {
        posts[postIdx] = {
          ...sourcePost,
          reblogged_by: posts[postIdx].author,
          checkForFollow: {
            name: posts[postIdx].author,
            youFollows: !!subscription,
          },
        };
      }
    }
  }
};

const fillObjects = async (posts, userName, wobjectsPath = 'fullObjects') => {
  let user;
  if (userName) {
    ({ user } = await User.getOne(userName));
  }
  for (const post of posts) {
    for (let wObject of _.get(post, 'wobjects') || []) {
      wObject = Object.assign(wObject, _.get(post, `[${wobjectsPath}]`, [])
        .find((i) => i.author_permlink === wObject.author_permlink));
    }
    post.wobjects = _.filter(post.wobjects || [], (obj) => _.isString(obj.object_type));
    post.wobjects = await addCampaignsToWobjects(
      {
        wobjects: post.wobjects,
        user,
      },
    );
    delete post[wobjectsPath];
  }
  return posts;
};

const checkUserStatus = async ({
  sponsor,
  userName,
  campaign,
  reviewPermlink,
}) => {
  const { result } = await paymentHistory.findByCondition({
    sponsor,
    userName,
    'details.review_permlink': reviewPermlink,
    type: PAYMENT_HISTORIES_TYPES.REVIEW,
  });

  if (_.isEmpty(result)) return true;
  const permlink = _.get(result, '[0].details.reservation_permlink');
  const user = _.find(campaign.users, (u) => u.permlink === permlink);
  return !user || _.get(user, 'status') === RESERVATION_STATUSES.REJECTED;
};

const getLikedSum = ({
  post, ratio, payoutToken, guideName, bots,
}) => {
  let likedSum = 0;
  const registeredVotes = _.filter(
    post.active_votes,
    (v) => _.includes([..._.map(bots, 'botName'), guideName], v.voter) && !v.fake,
  );
  for (const el of registeredVotes) {
    likedSum += (ratio * _.get(el, `rshares${payoutToken}`, 0));
  }

  return likedSum;
};

const recalcRshares = ({ post, payoutToken }) => {
  post[`net_rshares_${payoutToken}`] = _.reduce(
    post.active_votes,
    (acc, el) => acc + _.get(el, `rshares${payoutToken}`, 0),
    0,
  );
};

const updateTotalRewards = ({ post, key, reward }) => {
  // Check if the key exists in the post object
  if (post[key] !== undefined) {
    // Convert the value to a number if it's a string
    if (typeof post[key] === 'string') {
      post[key] = parseFloat(post[key]) || 0;
    }
    // Add the rewardInToken to the existing value
    post[key] += reward;
  } else {
    // Initialize the value if it doesn't exist
    post[key] = reward;
  }
};

const sponsorObligationsNewReview = async ({
  post,
  blacklist = [],
  requestUserName,
}) => {
  post.blacklisted = blacklist.includes(post.author);
  post.campaigns = [];

  const beforeCashOut = new Date(post.cashout_time) > new Date();
  const campaigns = await CampaignV2.findCompletedByPost(post);
  if (!campaigns?.length) return;

  post.guideName = campaigns[0]?.guideName;
  post.reservationPermlink = campaigns[0]?.users[0]?.reservationPermlink;
  post.reservationRootAuthor = campaigns[0]?.users[0]?.rootName;

  const bots = await SponsorsUpvote.getBotsByPost(post);

  const campaignSymbols = _.uniq(campaigns.map((el) => el.payoutToken));

  const symbols = await Promise.all(campaignSymbols.map(
    async (el) => {
      const { result: tokenRate } = await currenciesRequests.getEngineRate({ token: el });
      return { symbol: el, tokenRate: tokenRate?.USD };
    },
  ));

  const sponsors = campaigns.map((el) => el.guideName);

  for (const campaign of campaigns) {
    const {
      rewardInUSD,
      users,
      payoutToken,
      type,
      guideName,
      payoutTokenRateUSD,
      _id,
      name,
      contestRewards,
    } = campaign;
    const tokenRate = _.find(symbols, (el) => el.symbol === payoutToken)
      ?.tokenRate ?? payoutTokenRateUSD;

    let rewardForCampaign = rewardInUSD;

    if (contestRewards && contestRewards?.length) {
      rewardForCampaign = _.find(contestRewards, (r) => r.place === users[0].place)?.rewardInUSD
        || rewardInUSD;
    }

    if (requestUserName === guideName) {
      post.campaigns.push({
        reservationRootAuthor: users[0]?.rootName,
        reservationPermlink: users[0]?.reservationPermlink,
        guideName,
        type,
        name,
        campaignId: _id.toString(),
      });
    }

    const rewardInToken = new BigNumber(rewardForCampaign)
      .dividedBy(tokenRate).toNumber();
    const totalPayout = _.get(post, `total_payout_${payoutToken}`, 0);
    const voteRshares = _.get(post, `net_rshares_${payoutToken}`, 0);

    const ratio = voteRshares > 0 ? totalPayout / voteRshares : 0;

    if (ratio) {
      const likedSum = getLikedSum({
        post, ratio, payoutToken, guideName, bots,
      });

      const sponsorPayout = rewardInToken - (likedSum / 2);
      if (sponsorPayout <= 0) continue;

      if (beforeCashOut) {
        updateTotalRewards({
          post,
          key: `total_payout_${payoutToken}`,
          reward: sponsorPayout,
        });
      } else if (!totalPayout && !_.isEmpty(bots)) {
        updateTotalRewards({
          post,
          key: `total_rewards_${payoutToken}`,
          reward: rewardInToken,
        });
      } else {
        updateTotalRewards({
          post,
          key: `total_rewards_${payoutToken}`,
          reward: sponsorPayout,
        });
      }

      const hasSponsor = _.find(post.active_votes, (el) => el.voter === guideName);

      if (hasSponsor) {
        if (hasSponsor.percent === 0) {
          hasSponsor.percent = 100;
          hasSponsor.fake = true;
        }
        hasSponsor[`rshares${payoutToken}`] = _.get(hasSponsor, `rshares${payoutToken}`, 0)
          + Math.round(sponsorPayout / ratio);
        hasSponsor.sponsor = true;
      } else {
        post.active_votes.push({
          voter: guideName,
          [`rshares${payoutToken}`]: Math.round(sponsorPayout / ratio),
          rshares: 1,
          sponsor: true,
          fake: true,
          percent: 10000,
        });
      }
      recalcRshares({ post, payoutToken });
      continue;
    }
    if (beforeCashOut) {
      updateTotalRewards({
        post,
        key: `total_payout_${payoutToken}`,
        reward: rewardInToken,
      });
    } else {
      updateTotalRewards({
        post,
        key: `total_rewards_${payoutToken}`,
        reward: rewardInToken,
      });
    }

    _.forEach(post.active_votes, (el) => {
      const sponsor = sponsors.includes(el.voter);
      if (!sponsor) el[`rshares${payoutToken}`] = 0;
    });

    const hasSponsor = _.find(
      post.active_votes,
      (el) => el.voter === guideName,
    );

    if (hasSponsor) {
      if (hasSponsor.percent === 0) {
        hasSponsor.percent = 100;
        hasSponsor.fake = true;
      }
      hasSponsor[`rshares${payoutToken}`] = rewardInToken;
      hasSponsor.sponsor = true;
    } else {
      post.active_votes.push({
        voter: guideName,
        [`rshares${payoutToken}`]: rewardInToken,
        rshares: 1,
        sponsor: true,
        fake: true,
        percent: 10000,
      });
    }

    recalcRshares({ post, payoutToken });
  }
};

const oldCampaignsObligations = async (post, campaignId) => {
  const { result: campaign } = await Campaign.findOne({ _id: campaignId });
  if (!campaign) return;
  // chek whether review is rejected
  const isRejected = await checkUserStatus({
    reviewPermlink: post.permlink,
    sponsor: campaign.guideName,
    userName: post.author,
    campaign,
  });
  if (isRejected) return;

  const beforeCashOut = new Date(post.cashout_time) > new Date();
  const { result: bots } = await botUpvoteModel
    .find({ author: post.root_author, permlink: post.permlink }, { botName: 1 });
  const postPendingPayout = parseFloat(_.get(post, 'pending_payout_value', 0));
  const postTotalPayout = parseFloat(_.get(post, 'total_payout_value', 0));
  const postCuratorPayout = parseFloat(_.get(post, 'curator_payout_value', 0));
  const totalPayout = beforeCashOut
    ? postPendingPayout
    : postTotalPayout + postCuratorPayout;
  const voteRshares = _.reduce(
    post.active_votes,
    (a, b) => a + parseInt(b.rshares, 10),
    0,
  );
  const ratio = voteRshares > 0 ? totalPayout / voteRshares : 0;

  if (ratio) {
    let likedSum = 0;
    const registeredVotes = _.filter(post.active_votes, (v) => _.includes([..._.map(bots, 'botName'), campaign.guideName], v.voter));
    for (const el of registeredVotes) {
      likedSum += (ratio * parseInt(el.rshares, 10));
    }
    const sponsorPayout = campaign.reward - (likedSum / 2);
    if (sponsorPayout <= 0) return;

    // eslint-disable-next-line no-nested-ternary
    beforeCashOut
      ? post.pending_payout_value = (postPendingPayout + sponsorPayout).toFixed(3)
      : !_.isEmpty(bots) && !postTotalPayout
        ? post.total_payout_value = campaign.reward.toFixed(3)
        : post.total_payout_value = (postTotalPayout + sponsorPayout).toFixed(3);

    const hasSponsor = _.find(post.active_votes, (el) => el.voter === campaign.guideName);
    if (hasSponsor) {
      if (hasSponsor.percent === 0) {
        hasSponsor.percent = 100;
        hasSponsor.fake = true;
      }
      hasSponsor.rshares = parseInt(hasSponsor.rshares, 10) + Math.round(sponsorPayout / ratio);
      hasSponsor.sponsor = true;
    } else {
      post.active_votes.push({
        voter: campaign.guideName,
        rshares: Math.round(sponsorPayout / ratio),
        sponsor: true,
        fake: true,
        percent: 10000,
      });
    }
  } else {
    beforeCashOut
      ? post.pending_payout_value = campaign.reward
      : post.total_payout_value = campaign.reward;
    _.forEach(post.active_votes, (el) => {
      el.rshares = 0;
    });
    const hasSponsor = _.find(post.active_votes, (el) => el.voter === campaign.guideName);
    if (hasSponsor) {
      if (hasSponsor.percent === 0) {
        hasSponsor.percent = 100;
        hasSponsor.fake = true;
      }
      hasSponsor.rshares = campaign.reward;
      hasSponsor.sponsor = true;
    } else {
      post.active_votes.push({
        voter: campaign.guideName,
        rshares: campaign.reward,
        sponsor: true,
        fake: true,
        percent: 10000,
      });
    }
  }
  post.net_rshares = _.reduce(post.active_votes, (acc, el) => acc + el.rshares, 0);

  return post;
};

/**
 * Method calculate and add sponsor obligations to each post if it is review
 * @beforeCashOut checks either the cashout_time has passed or not
 */
const additionalSponsorObligations = async (posts, userName, requestUserName) => {
  const blacklist = await blacklistModel.getUserBlacklist(userName);

  for (const post of posts) {
    if (!post) continue;
    const campaignReview = await CampaignPosts.findOneByPost(post);
    if (campaignReview) {
      await sponsorObligationsNewReview({ post, blacklist, requestUserName });
      continue;
    }
    const metadata = post.json_metadata ? jsonHelper.parseJson(post.json_metadata, null) : null;
    const campaignId = _.get(metadata, 'campaignId');
    const activationPermlink = _.get(metadata, 'campaignActivationPermlink');
    if (campaignId) await oldCampaignsObligations(post, campaignId);
    if (activationPermlink) {
      post.giveaway = (await CampaignV2.findOne({
        filter: {
          activationPermlink,
          type: CAMPAIGN_TYPES.GIVEAWAYS,
          status: CAMPAIGN_STATUSES.ACTIVE,
        },
        projection: {
          giveawayRequirements: 1,
          userRequirements: 1,
          requirements: 1,
          rewardInUSD: 1,
          reward: 1,
          currency: 1,
          payoutToken: 1,
          budget: 1,
        },
      }))?.result;
    }
  }
  return posts;
};

const getTagsByUser = async ({
  author, skip, limit, checkedTags,
}) => {
  let tags = [];
  const { posts } = await PostRepository.findByCondition({ author }, { wobjects: 1 });

  for (const post of posts) {
    if (!_.isArray(post.wobjects)) continue;
    for (const wobject of post.wobjects) {
      if (!wobject.author_permlink) continue;
      const existsInTags = tags.find((el) => el.author_permlink === wobject.author_permlink);
      existsInTags
        ? existsInTags.counter++
        : tags.push({
          counter: 1,
          author_permlink: wobject.author_permlink,
        });
    }
  }
  tags.sort((a, b) => b.counter - a.counter);

  if (checkedTags?.length) {
    tags = tags.sort((a, b) => {
      const aIndex = checkedTags.indexOf(a.author_permlink);
      const bIndex = checkedTags.indexOf(b.author_permlink);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  const process = _.slice(tags, skip, skip + limit + 1);

  const { result: wobjects } = await getCurrentNames(_.map(process, 'author_permlink'));

  const result = _.map(process, (tag) => {
    const wobject = wobjects.find((el) => tag.author_permlink === el.author_permlink);
    return {
      name: _.get(wobject, 'name', _.get(tag, 'author_permlink')),
      author_permlink: tag.author_permlink,
      counter: tag?.counter ?? 0,
    };
  });

  let resp = result.sort((a, b) => b.counter - a.counter);
  if (checkedTags?.length) {
    resp = result.sort((a, b) => {
      const aIndex = checkedTags.indexOf(a.author_permlink);
      const bIndex = checkedTags.indexOf(b.author_permlink);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  return { tags: resp };
};

const getCachedPosts = async (key) => {
  const { result: resp } = await redisGetter.getAsync({
    key: `post_cache:${key}`,
    client: redis.mainFeedsCacheClient,
  });
  if (!resp) return;
  const parsedCache = jsonHelper.parseJson(resp, null);
  if (!parsedCache) return;
  return parsedCache;
};

const setCachedPosts = async ({
  key,
  posts,
  ttl,
}) => {
  await redisSetter.set({
    key: `post_cache:${key}`,
    value: JSON.stringify(posts),
  });
  await redisSetter.expire({
    key: `post_cache:${key}`,
    ttl,
  });
};

const getPostCacheKey = (data = {}) => crypto
  .createHash('md5')
  .update(`${JSON.stringify(data)}`, 'utf8')
  .digest('hex');

// from middelware
const fillAdditionalInfo = async ({
  posts = [],
  userName,
}) => {
  await fillReblogs(posts, userName);
  posts = await fillObjects(posts, userName);
  await addAuthorWobjectsWeight(posts);
  posts = await additionalSponsorObligations(posts);
  return posts;
};

module.exports = {
  additionalSponsorObligations,
  addAuthorWobjectsWeight,
  getWobjFeedCondition,
  getPostsByCategory,
  checkUserStatus,
  getPostObjects,
  mergePostData,
  fillReblogs,
  fillObjects,
  getTagsByUser,
  getCachedPosts,
  setCachedPosts,
  getPostCacheKey,
  fillAdditionalInfo,
};
