const {
  CommentRef, Wobj, User, Post: PostRepository, Subscriptions,
  Campaign, paymentHistory, botUpvoteModel, matchBotModel,
} = require('models');
const { Post } = require('database').models;
const { postsUtil } = require('utilities/steemApi');
const _ = require('lodash');
const { REQUIREDFIELDS_POST } = require('constants/wobjectsData');

/**
 * Get wobjects data for particular post
 * @param author {String}
 * @param permlink {String}
 * @returns {Promise<{wObjectsData: *, wobjectPercents: *}>}
 * wObjectsData - full wobjects info(fields, def.name, posts counts etc.),
 * wobjectPercent - author_permlinks with percent which author noticed on particular post
 */
const getPostObjects = async (author = '', permlink = '') => {
  const { commentRef } = await CommentRef.getRef(`${author}_${permlink}`);

  if (_.isString(_.get(commentRef, 'wobjects'))) {
    let wobjs;

    try {
      wobjs = JSON.parse(commentRef.wobjects);
    } catch (e) {
      console.log(e);
    }
    if (Array.isArray(wobjs) && !_.isEmpty(wobjs)) {
      const { result: wObjectsData } = await Wobj.find(
        { author_permlink: { $in: _.map(wobjs, 'author_permlink') } }, {
          fields: 1, author_permlink: 1, weight: 1, object_type: 1, default_name: 1, parent: 1,
        },
      );
      wObjectsData.forEach((wobj) => {
        wobj.fields = wobj.fields.filter((field) => _.includes(REQUIREDFIELDS_POST, field.name));
      });
      return { wObjectsData, wobjectPercents: wobjs };
    }
  }
};

const getPostsByCategory = async (data) => {
  const { posts, error } = await postsUtil.getPostsByCategory(data);

  if (error) {
    return { error };
  }
  if (!posts || posts.error) {
    return { error: { status: 404, message: _.get(posts, 'error.message', 'Posts not found') } };
  }
  if (!posts.length) return { posts: [] };
  // get posts array by authors and permlinks
  const { posts: dbPosts, error: postsDbError } = await PostRepository.getManyPosts(
    posts.map((p) => (_.pick(p, ['author', 'permlink']))),
  );
  if (postsDbError) {
    return { error: postsDbError };
  }

  await Promise.all(posts.map(async (post) => {
    if (post && post.author && post.permlink) {
      const dbPost = dbPosts.find((p) => p.author === post.author && p.permlink === post.permlink);
      post = await mergePostData(post, dbPost);
    }
  }));
  return { posts };
};

/**
 * Get post from DB and merge fields which doesn't exists in source post(from steem)
 * @param postSteem
 * @param postDb *optional*
 * @returns {Promise<{error: *}|*>}
 */
const mergePostData = async (postSteem, postDb) => {
  if (!postDb) {
    if (!postSteem) return;
    const { post: dbPost, error } = await PostRepository.getOne({
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
  // fill active_votes in case votes from guest users
  postDb.active_votes.forEach((dbVote) => {
    if (!postSteem.active_votes.find((v) => v.voter === dbVote.voter)) {
      postSteem.active_votes.push(dbVote);
    }
  });

  return postSteem;
};

// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async (authorPermlink) => {
  const { wObject, error } = await Wobj.getOne(authorPermlink);

  if (error) {
    return { error };
  } if (!wObject.newsFilter) {
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
  const { result: users, error } = await User.aggregate([
    { $match: { name: { $in: names } } }, { $project: { name: 1, wobjects_weight: 1 } }]);

  if (error || !users) {
    console.error(error || 'Get Users wobjects_weight no result!');
    return;
  }
  posts.forEach((post) => {
    const reputation = _.get(users.find((user) => user.name === post.author), 'wobjects_weight');
    post.author_wobjects_weight = reputation;
    post.author_reputation = reputation;
  });
};

const fillReblogs = async (posts = [], userName) => {
// const fillReblogs = async (posts = []) => {
  for (const postIdx in posts) {
    if (_.get(posts, `[${postIdx}].reblog_to.author`) && _.get(posts, `[${postIdx}].reblog_to.permlink`)) {
      let sourcePost;

      try {
        const author = _.get(posts, `[${postIdx}].reblog_to.author`);
        const permlink = _.get(posts, `[${postIdx}].reblog_to.permlink`);
        sourcePost = await Post
          .findOne({
            $or: [{ author, permlink }, { root_author: author, permlink }],
          })
          .populate({ path: 'fullObjects', select: '-latest_posts -last_posts_counts_by_hours' })
          .lean();
      } catch (error) {
        console.error(error);
      }
      let subscription;
      if (userName) {
        ({ subscription } = await Subscriptions
          .findOne({ follower: userName, following: posts[postIdx].author }));
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
const jsonParse = (post) => {
  try {
    return JSON.parse(post.json_metadata);
  } catch (error) {
    return null;
  }
};

const additionalSponsorObligations = async (posts) => {
  if (_.isEmpty(posts)) return;
  for (const post of posts) {
    const metadata = post.json_metadata ? jsonParse(post) : null;
    const _id = _.get(metadata, 'campaignId');
    // if post metadata doesn't have campaignId it's not review
    if (!_id) continue;

    const { result: campaign } = await Campaign.findOne({ _id });
    if (!campaign) continue;
    const { bots } = await matchBotModel.find({}, { bot_name: 1 });
    // const { result: upvote } = await botUpvoteModel
    //   .findOne({ author: post.author, permlink: post.permlink });
    // if (!campaign || !upvote) continue;
    //
    // const user = _.find(campaign.users, (u) => u.permlink === upvote.reservationPermlink);
    // const { result: histories } = await paymentHistory.findByCondition({ 'details.reservation_permlink': _.get(user, 'permlink') });
    // if (!user || !histories.length) continue;
    //
    // const rewards = _.filter(histories, (history) => _.includes(['beneficiary_fee', 'review'], history.type));
    // const rewardSponsor = _.sumBy(rewards, 'amount')
    //   * _.get(user, 'hiveCurrency', _.get(rewards, '[0].details.hiveCurrency'));
    // post.guideName = campaign.guideName;
    // post.sponsor_payout_value = rewardSponsor.toFixed(3);

    const totalPayout = parseFloat(post.pending_payout_value)
      + parseFloat(post.total_payout_value)
      + parseFloat(post.curator_payout_value);
    const voteRshares = post.active_votes.reduce(
      (a, b) => a + parseFloat(b.rshares_weight || b.rshares),
      0,
    );
    const ratio = voteRshares > 0 ? totalPayout / voteRshares : 0;
    if (ratio) {
      let likedSum = 0;
      for (const el of _.filter(post.active_votes, (v) => _.includes([..._.map(bots, 'bot_name'), campaign.guideName], v.voter))) {
        likedSum += (ratio * (el.rshares_weight || el.rshares)) / 2;
      }
      post.sponsor_payout_value = campaign.reward - likedSum;
      post.sponsor = { voter: campaign.guideName, rhares: (post.sponsor_payout_value / ratio) * 2 };
    } else {
      post.sponsor = { voter: campaign.guideName, rhares: Math.abs(voteRshares) * 100 };
      post.sponsor_payout_value = campaign.reward;
    }

    // const totalPayout2 = parseFloat(post.pending_payout_value)
    //   + parseFloat(post.total_payout_value)
    //   + parseFloat(post.curator_payout_value)
    //   + parseFloat(post.sponsor_payout_value);
    // const weightSponsor = (post.sponsor_payout_value / ratio) * 2;
    // const check = (ratio * weightSponsor) / 2;
    // const check2 = post.sponsor_payout_value + likedSum;
    // console.log('yo');
    // if ratio 0 full sum how to calculate?
    //
    // const minusArray = [
    //   {
    //     _id: '5f71ed5a1e68a4847c8707f7',
    //     voter: 'naha',
    //     weight: -84907,
    //     percent: -10000,
    //     rshares: -84907368342,
    //   },
    //   {
    //     voter: 'me',
    //     rshares: 8490736834200,
    //   },
    // ];
    //
    // const rharesMinus2 = minusArray.reduce(
    //   (a, b) => a + parseFloat(b.rshares_weight || b.rshares),
    //   0,
    // );
    // const ratio3 = rharesMinus2 > 0 ? 3 / rharesMinus2 : 0;
    // const myBucks = ratio3 * 8490736834200;
    //
    // console.log('yo');
  }
};

module.exports = {
  getPostObjects,
  getPostsByCategory,
  getWobjFeedCondition,
  addAuthorWobjectsWeight,
  fillReblogs,
  mergePostData,
  additionalSponsorObligations,
};
