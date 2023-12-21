const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

const dbName = 'waivio';

const connectMongo = async () => {
  await client.connect();
};

module.exports = {
  connectMongo,
  client,
};

// module.exports = (async () => {
//   await client.connect();
//   const db = client.db(dbName);
//
//   const UserWobjects = db.collection('user_wobjects');
//   const CommentRef = db.collection('commentrefs');
//   const ObjectType = db.collection('objecttypes');
//   const WObject = db.collection('wobjects');
//   const Comment = db.collection('comments');
//   const User = db.collection('users');
//   const Post = db.collection('posts');
//   const App = db.collection('apps');
//   const Campaign = db.collection('campaigns');
//   const CampaignV2 = db.collection('campaignsV2');
//   const CampaignPayments = db.collection('campaign_payments');
//   const PaymentHistory = db.collection('payment_histories');
//   const Subscriptions = db.collection('subscriptions');
//   const WobjectSubscriptions = db.collection('wobjectsubscriptions');
//   const WebsitePayments = db.collection('website_payments');
//   const WebsiteRefunds = db.collection('website_refunds');
//   const BotUpvote = db.collection('bot_upvotes');
//   const RelatedAlbum = db.collection('related_albums');
//   const HiddenPost = db.collection('hidden_posts');
//   const HiddenComment = db.collection('hidden_comments');
//   const MutedUser = db.collection('muted_users');
//   const Blacklist = db.collection('guide-blacklists');
//   const GeoIp = db.collection('geo_ips');
//   const VipTicket = db.collection('vip_tickets');
//   const Prefetch = db.collection('prefetches');
//   const EngineAccountHistory = db.collection('engine_account_histories');
//   const WalletExemptions = db.collection('wallet_exemptions');
//   const GuestWallet = db.collection('guest_wallets');
//   const PageDraft = db.collection('page_drafts');
//   const Department = db.collection('departments');
//   const CampaignPosts = db.collection('campaign_posts');
//   const AppAffiliate = db.collection('app_affiliates');
//   const SponsorsUpvote = db.collection('sponsors_bots_upvotes');
//   const UserShopDeselect = db.collection('user_shop_deselect');
//   const WithdrawFunds = db.collection('withdraw-funds');
//   const UserCommentDraft = db.collection('user_comment_drafts');
//   const UserDraft = db.collection('user_drafts');
//   const Threads = db.collection('threads');
//
//   console.log('connected WAIVIO');
//
//   return {
//     UserWobjects,
//     CommentRef,
//     ObjectType,
//     WObject,
//     Comment,
//     User,
//     Post,
//     App,
//     Campaign,
//     CampaignV2,
//     CampaignPayments,
//     PaymentHistory,
//     Subscriptions,
//     WobjectSubscriptions,
//     WebsitePayments,
//     WebsiteRefunds,
//     BotUpvote,
//     RelatedAlbum,
//     HiddenPost,
//     HiddenComment,
//     MutedUser,
//     Blacklist,
//     GeoIp,
//     VipTicket,
//     Prefetch,
//     EngineAccountHistory,
//     WalletExemptions,
//     GuestWallet,
//     PageDraft,
//     Department,
//     CampaignPosts,
//     AppAffiliate,
//     SponsorsUpvote,
//     UserShopDeselect,
//     WithdrawFunds,
//     UserCommentDraft,
//     UserDraft,
//     Threads,
//   };
// })();
