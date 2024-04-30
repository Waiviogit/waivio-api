const { FOLLOWERS_SORT, VALID_FOLLOWERS_SORT } = require('constants/sortData');
const { SUPPORTED_CURRENCIES, LANGUAGES } = require('constants/common');
const { customValidationHelper } = require('utilities/helpers');
const Joi = require('joi');
const moment = require('moment');
const { SUPPORTED_CRYPTO_CURRENCIES, GUEST_COINS_TO_WITHDRAW } = require('../../constants/currencyData');

exports.indexSchema = Joi.object().keys({
  limit: Joi.number().integer().min(1).default(30),
  skip: Joi.number().integer().min(0).default(0),
  sample: Joi.boolean().truthy('true'),
});

exports.objectsSharesSchema = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  locale: Joi.string().default('en-US'),
  name: Joi.string().required(),
  object_types: Joi.array().items(Joi.string().required()).default(null),
  exclude_object_types: Joi.array().items(Joi.string().required()).default(null),
});

exports.getPostFiltersSchema = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(300)
    .default(30),
  skip: Joi.number().integer().min(0).max(300)
    .default(0),
  name: Joi.string().required(),
});

exports.showSchema = Joi.object().keys({
  name: Joi.string().required(),
  with_followings: Joi.bool().default(false),
  userName: Joi.string().default(''),
});

exports.objectsFollowSchema = Joi.object().keys({
  name: Joi.string().required(),
  locale: Joi.string().default('en-US'),
  limit: Joi.number().integer().min(0).max(100)
    .default(50),
  skip: Joi.number().integer().min(0).default(0),
});

exports.usersFollowSchema = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).max(100)
    .default(50),
  skip: Joi.number().integer().min(0).default(0),
  sort: Joi.string().valid(...VALID_FOLLOWERS_SORT).default(FOLLOWERS_SORT.RECENCY),
});

exports.objectsFeedSchema = Joi.object().keys({
  user: Joi.string().required(),
  limit: Joi.number().integer().min(0).max(50)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
});

exports.feedSchema = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).max(50)
    .default(20),
  skip: Joi.number().integer().min(0).default(0),
  lastId: Joi.string().custom(customValidationHelper.validateObjectId, 'Validate Mongoose ObjectId'),
  filter: Joi.object().keys({
    byApp: Joi.string().allow(''),
  }),
  forApp: Joi.string(),
  user_languages: Joi.array().items(Joi.string().valid(...LANGUAGES)).default(['en-US']),
  userName: Joi.string().default(''),
  locale: Joi.string().default('en-US'),
});

exports.searchSchema = Joi.object().keys({
  searchString: Joi.string().lowercase().default(''),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).max(500)
    .default(30),
  notGuest: Joi.boolean().default(false),
});

exports.getDelegationSchema = Joi.object().keys({
  account: Joi.string().required(),
});

exports.updateMetadataSchema = Joi.object().keys({
  user_name: Joi.string().required(),
  user_metadata: Joi.object().keys({
    notifications_last_timestamp: Joi.number().min(0).default(0),
    bookmarks: Joi.array().items(Joi.string()).default([]),
    new_user: Joi.boolean().default(false),
    settings: Joi.object().keys({
      shop: Joi.object().keys({
        hideLinkedObjects: Joi.boolean().default(false),
      }),
      hideFavoriteObjects: Joi.boolean().default(false),
      exitPageSetting: Joi.boolean().default(false),
      locale: Joi.string().valid(...LANGUAGES).default('auto'),
      postLocales: Joi.array().items(Joi.string().valid(...LANGUAGES)).default([]),
      nightmode: Joi.boolean().default(false),
      rewardSetting: Joi.string().valid('SP', '50', 'STEEM').default('50'),
      rewriteLinks: Joi.boolean().default(false),
      showNSFWPosts: Joi.boolean().default(false),
      upvoteSetting: Joi.boolean().default(false),
      hiveBeneficiaryAccount: Joi.string().default('').allow(''),
      votePercent: Joi.number().min(1).max(10000).default(5000),
      votingPower: Joi.boolean().default(false),
      currency: Joi.string().valid(...Object.values(SUPPORTED_CURRENCIES))
        .default(SUPPORTED_CURRENCIES.USD),
      userNotifications: Joi.object().keys({
        activationCampaign: Joi.boolean().default(true),
        deactivationCampaign: Joi.boolean().default(true),
        follow: Joi.boolean().default(true),
        fillOrder: Joi.boolean().default(true),
        mention: Joi.boolean().default(true),
        minimalTransfer: Joi.number().min(0).default(0),
        reblog: Joi.boolean().default(true),
        reply: Joi.boolean().default(true),
        statusChange: Joi.boolean().default(true),
        suspendedStatus: Joi.boolean().default(true),
        transfer: Joi.boolean().default(true),
        powerUp: Joi.boolean().default(true),
        witness_vote: Joi.boolean().default(true),
        myPost: Joi.boolean().default(false),
        myComment: Joi.boolean().default(false),
        myLike: Joi.boolean().default(false),
        like: Joi.boolean().default(true),
        downvote: Joi.boolean().default(false),
        claimReward: Joi.boolean().default(false),
        objectUpdates: Joi.boolean().default(false),
        objectGroupId: Joi.boolean().default(false),
        threadAuthorFollower: Joi.boolean().default(false),
      }),
    }),
    drafts: Joi.array().items(Joi.object().keys({
      _id: Joi.string(),
      draftId: Joi.string(),
      title: Joi.string(),
      author: Joi.string(),
      beneficiary: Joi.boolean().default(false),
      isUpdating: Joi.boolean(),
      upvote: Joi.boolean().optional(),
      body: Joi.string(),
      originalBody: Joi.string(),
      jsonMetadata: Joi.object(),
      lastUpdated: Joi.number(),
      parentAuthor: Joi.string().allow(''),
      parentPermlink: Joi.string(),
      permlink: Joi.string(),
      reward: Joi.string().optional(),
    })).default([]),
  }),
});

exports.blogSchema = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).default(20),
  skip: Joi.number().integer().min(0).default(0),
  start_author: Joi.string().allow('').default(''),
  start_permlink: Joi.string().allow('').default(''),
  userName: Joi.string().default(''),
  tagsArray: Joi.array().items(Joi.string()).default([]),
});

exports.blogTagsSchema = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).default(20),
  skip: Joi.number().integer().min(0).default(0),
});

exports.followingUpdates = Joi.object().keys({
  name: Joi.string().required(),
  users_count: Joi.number().integer().min(0).max(100)
    .default(3),
  wobjects_count: Joi.number().integer().min(0).max(100)
    .default(3),
});

exports.followingUsersUpdates = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).max(100)
    .default(3),
  skip: Joi.number().integer().min(0).max(100)
    .default(0),
});

exports.followingWobjectsUpdates = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).max(100)
    .default(3),
  skip: Joi.number().integer().min(0).max(100)
    .default(0),
  object_type: Joi.string().invalid('').required(),
});

exports.getFollowers = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  sort: Joi.string().valid(...VALID_FOLLOWERS_SORT).default(FOLLOWERS_SORT.RECENCY),
});

exports.comments = Joi.object().keys({
  name: Joi.string().required(),
  limit: Joi.number().integer().min(0).default(30),
  skip: Joi.number().integer().min(0).default(0),
  start_permlink: Joi.string().invalid('').default(null),
  userName: Joi.string().default(''),
});

exports.followingsState = Joi.object().keys({
  name: Joi.string().required(),
  users: Joi.array().items(Joi.string()).single().required(),
});

exports.usersArray = Joi.object().keys({
  users: Joi.array().items(Joi.string()).required(),
  limit: Joi.number().integer().min(0).default(20),
  skip: Joi.number().integer().min(0).default(0),
  name: Joi.string(),
});

exports.voteValue = Joi.object().keys({
  userName: Joi.string().required(),
  author: Joi.string().required(),
  permlink: Joi.string().required(),
  weight: Joi.number().min(0).max(100).required(),
});

exports.waivVoteValue = Joi.object().keys({
  userName: Joi.string().required(),
  weight: Joi.number().min(0).max(100).required(),
});

exports.putGeo = Joi.object().keys({
  ip: Joi.string().required(),
  longitude: Joi.number().min(-180).max(180).required(),
  latitude: Joi.number().min(-90).max(90).required(),
});

exports.advancedWalletSchema = Joi.object().keys({
  accounts: Joi.array().items(Joi.object().keys({
    name: Joi.string().required(),
    lastId: Joi.string().default(''),
  })).single().min(1)
    .required(),
  endDate: Joi.date().timestamp('unix').less('now').default(() => new Date()),
  startDate: Joi.date().timestamp('unix').default(moment.utc().subtract(10, 'year').toDate()).less(Joi.ref('endDate')),
  filterAccounts: Joi.array().items(Joi.string()).min(1).required(),
  limit: Joi.number().default(10),
  user: Joi.string().default(''),
  currency: Joi.string()
    .valid(...Object.values(SUPPORTED_CURRENCIES)).default(SUPPORTED_CURRENCIES.USD),
  symbol: Joi.string().valid(SUPPORTED_CRYPTO_CURRENCIES.WAIV).default(SUPPORTED_CRYPTO_CURRENCIES.WAIV),
});

exports.advancedWalletGenerateSchema = Joi.object().keys({
  accounts: Joi.array().items(Joi.object().keys({
    name: Joi.string().required(),
    lastId: Joi.string().default(''),
  })).single().min(1)
    .required(),
  endDate: Joi.date().timestamp('unix').less('now').default(() => new Date()),
  startDate: Joi.date().timestamp('unix').default(moment.utc().subtract(10, 'year').toDate()).less(Joi.ref('endDate')),
  filterAccounts: Joi.array().items(Joi.string()).min(1).required(),
  user: Joi.string().default(''),
  currency: Joi.string()
    .valid(...Object.values(SUPPORTED_CURRENCIES)).default(SUPPORTED_CURRENCIES.USD),
  symbol: Joi.string().valid(SUPPORTED_CRYPTO_CURRENCIES.WAIV).default(SUPPORTED_CRYPTO_CURRENCIES.WAIV),
});

exports.guestWallet = Joi.object().keys({
  account: Joi.string().required(),
  symbol: Joi.string().required(),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(0).default(30),
});

exports.guestBalance = Joi.object().keys({
  account: Joi.string().required(),
  symbol: Joi.string().required(),
});

exports.guestMana = Joi.object().keys({
  account: Joi.string().required(),
});

exports.guestWithdrawHiveSchema = Joi.object().keys({
  amount: Joi.number().greater(0).required(),
  address: Joi.string().required(),
  userName: Joi.string().required(),
  outputCoinType: Joi.string().valid(...GUEST_COINS_TO_WITHDRAW).required(),
});

exports.guestWithdrawHiveEstimatesSchema = Joi.object().keys({
  amount: Joi.number().greater(0).required(),
  outputCoinType: Joi.string().valid(...GUEST_COINS_TO_WITHDRAW).required(),

});

exports.guestWithdrawHiveRangeSchema = Joi.object().keys({
  outputCoinType: Joi.string().valid(...GUEST_COINS_TO_WITHDRAW).required(),
});

exports.getAffiliateSchema = Joi.object().keys({
  userName: Joi.string().required(),
  host: Joi.string(),
});

exports.minRejectSchema = Joi.object().keys({
  userName: Joi.string().required(),
  author: Joi.string().required(),
  permlink: Joi.string().required(),
  authorPermlink: Joi.string().required(),
});

exports.getFavoritesSchema = Joi.object().keys({
  userName: Joi.string().required(),
  follower: Joi.string(),
  limit: Joi.number().integer().min(1).default(10),
  skip: Joi.number().integer().min(0).default(0),
  objectType: Joi.string(),
  locale: Joi.string().valid(...LANGUAGES).default('auto'),
});

exports.getAvatarsSchema = Joi.object().keys({
  names: Joi.array().items(Joi.string()).min(1).max(30),
});
