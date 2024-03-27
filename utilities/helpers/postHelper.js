const _ = require('lodash');
const {
  Wobj,
  User,
  Post: PostRepository,
  Subscriptions,
  Campaign,
  botUpvoteModel,
  paymentHistory,
  CampaignPosts,
  CampaignV2,
  SponsorsUpvote,
  blacklistModel,
} = require('models');
const { addCampaignsToWobjects } = require('utilities/helpers/campaignsHelper');
const { Post } = require('database').models;
const { REQUIREDFIELDS_POST } = require('constants/wobjectsData');
const {
  RESERVATION_STATUSES,
  PAYMENT_HISTORIES_TYPES,
} = require('constants/campaignsData');
const { getCurrentNames } = require('utilities/helpers/wObjectHelper');
const {
  redis,
  redisGetter,
  redisSetter,
} = require('utilities/redis');
const jsonHelper = require('utilities/helpers/jsonHelper');
const currenciesRequests = require('utilities/requests/currenciesRequests');
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

const jsonParse = (post) => {
  try {
    return JSON.parse(post.json_metadata);
  } catch (error) {
    return null;
  }
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

const sponsorObligationsNewReview = async ({
  post,
  newReview,
  blacklist = [],
}) => {
  const { guideName = '', reservationPermlink = '' } = newReview;

  post.guideName = guideName;
  post.reservationPermlink = reservationPermlink;
  post.blacklisted = blacklist.includes(post.author);

  const totalPayout = _.get(post, `total_payout_${newReview.symbol}`);
  const voteRshares = _.get(post, `net_rshares_${newReview.symbol}`);

  const ratio = voteRshares > 0 ? totalPayout / voteRshares : 0;
  const beforeCashOut = new Date(post.cashout_time) > new Date();
  const { result: campaign } = await CampaignV2.findOne({
    filter: {
      users: {
        $elemMatch: {
          name: newReview.author, reviewPermlink: newReview.permlink,
        },
      },
    },
    projection: { rewardInUSD: 1, users: 1 },
  });
  const user = _.find(
    campaign.users,
    (u) => u.name === newReview.author
      && u.reservationPermlink === reservationPermlink,
  );

  post.reservationRootAuthor = user?.rootName || '';

  const { result: bots } = await SponsorsUpvote
    .find({
      filter: {
        author: post.root_author,
        permlink: post.permlink,
      },
      projection: { botName: 1 },

    });

  const { result: tokenRate } = await currenciesRequests.getEngineRate({ token: newReview.symbol });

  const rewardInToken = new BigNumber(campaign.rewardInUSD)
    .dividedBy(_.get(tokenRate, 'USD', newReview.payoutTokenRateUSD)).toNumber();

  if (ratio) {
    let likedSum = 0;
    const registeredVotes = _.filter(post.active_votes, (v) => _.includes([..._.map(bots, 'botName'), newReview.guideName], v.voter));
    for (const el of registeredVotes) {
      likedSum += (ratio * _.get(el, `rshares${newReview.symbol}`, 0));
    }
    const sponsorPayout = rewardInToken - (likedSum / 2);
    if (sponsorPayout <= 0) return;

    // eslint-disable-next-line no-nested-ternary
    beforeCashOut
      ? post[`total_payout_${newReview.symbol}`] = (totalPayout + sponsorPayout)
      : !totalPayout && !_.isEmpty(bots)
        ? post[`total_rewards_${newReview.symbol}`] = rewardInToken
        : post[`total_rewards_${newReview.symbol}`] = (totalPayout + sponsorPayout);

    const hasSponsor = _.find(post.active_votes, (el) => el.voter === newReview.guideName);

    if (hasSponsor) {
      if (hasSponsor.percent === 0) {
        hasSponsor.percent = 100;
        hasSponsor.fake = true;
      }
      hasSponsor[`rshares${newReview.symbol}`] = _.get(hasSponsor, `rshares${newReview.symbol}`, 0)
        + Math.round(sponsorPayout / ratio);
      hasSponsor.sponsor = true;
    } else {
      post.active_votes.push({
        voter: newReview.guideName,
        [`rshares${newReview.symbol}`]: Math.round(sponsorPayout / ratio),
        rshares: 1,
        sponsor: true,
        fake: true,
        percent: 10000,
      });
    }
  } else {
    beforeCashOut
      ? post[`total_payout_${newReview.symbol}`] = rewardInToken
      : post[`total_rewards_${newReview.symbol}`] = rewardInToken;
    _.forEach(post.active_votes, (el) => {
      el[`rshares${newReview.symbol}`] = 0;
    });
    const hasSponsor = _.find(
      post.active_votes,
      (el) => el.voter === newReview.guideName,
    );
    if (hasSponsor) {
      if (hasSponsor.percent === 0) {
        hasSponsor.percent = 100;
        hasSponsor.fake = true;
      }
      hasSponsor[`rshares${newReview.symbol}`] = rewardInToken;
      hasSponsor.sponsor = true;
    } else {
      post.active_votes.push({
        voter: newReview.guideName,
        [`rshares${newReview.symbol}`]: rewardInToken,
        rshares: 1,
        sponsor: true,
        fake: true,
        percent: 10000,
      });
    }
  }
  post[`net_rshares_${newReview.symbol}`] = _.reduce(
    post.active_votes,
    (acc, el) => acc + _.get(el, `rshares${newReview.symbol}`, 0),
    0,
  );
};

/**
 * Method calculate and add sponsor obligations to each post if it is review
 * @beforeCashOut checks either the cashout_time has passed or not
 */
const additionalSponsorObligations = async (posts, userName) => {
  const blacklist = await blacklistModel.getUserBlacklist(userName);

  for (const post of posts) {
    if (!post) continue;
    const metadata = post.json_metadata ? jsonParse(post) : null;
    const _id = _.get(metadata, 'campaignId');
    // if post metadata doesn't have campaignId it's not review
    const { result: newReview } = await CampaignPosts
      .findOne({
        filter: {
          author: post.author,
          permlink: post.permlink,
        },
      });
    if (newReview) {
      await sponsorObligationsNewReview({
        post,
        newReview,
        blacklist,
      });
      continue;
    }
    if (!_id) continue;

    const { result: campaign } = await Campaign.findOne({ _id });
    if (!campaign) continue;
    // chek whether review is rejected
    const isRejected = await checkUserStatus({
      reviewPermlink: post.permlink,
      sponsor: campaign.guideName,
      userName: post.author,
      campaign,
    });
    if (isRejected) continue;

    const beforeCashOut = new Date(post.cashout_time) > new Date();
    const { result: bots } = await botUpvoteModel
      .find({
        author: post.root_author,
        permlink: post.permlink,
      }, { botName: 1 });
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
      if (sponsorPayout <= 0) continue;

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
  }
  return posts;
};

const getTagsByUser = async ({ author, skip, limit }) => {
  const tags = [];
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

  return { tags: result.sort((a, b) => b.counter - a.counter) };
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
