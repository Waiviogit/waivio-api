const mongoose = require('mongoose');
const config = require('config');
const currenciesDb = require('currenciesDB/currenciesDB_Connection');
const { cursorTimeout } = require('./plugins/timeoutPlugin');

const URI = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;

mongoose.connect(URI)
  .then(() => console.log(`${config.db.database} connected`))
  .catch((error) => console.log(error));

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoose.connection.on('close', () => console.log(`closed ${config.db.database}`));

mongoose.plugin(cursorTimeout);

mongoose.set('debug', process.env.NODE_ENV === 'development');

const closeMongoConnections = async () => {
  await mongoose.connection.close(false);
  await currenciesDb.close(false);
};

const models = {};

models.UserWobjects = require('./schemas/UserWobjectsSchema');
models.CommentRef = require('./schemas/CommentRefSchema');
models.ObjectType = require('./schemas/ObjectTypeSchema');
models.WObject = require('./schemas/wObjectSchema');
models.Comment = require('./schemas/CommentSchema');
models.User = require('./schemas/UserSchema');
models.Post = require('./schemas/PostSchema');
models.App = require('./schemas/AppSchema');
models.Campaign = require('./schemas/CampaignSchema');
models.CampaignV2 = require('./schemas/CampaignV2Schema');
models.CampaignPayments = require('./schemas/CampaignPaymentsSchema');
models.PaymentHistory = require('./schemas/paymentHistorySchema');
models.Subscriptions = require('./schemas/SubscriptionSchema');
models.WobjectSubscriptions = require('./schemas/WobjectSubscriptionSchema');
models.WebsitePayments = require('./schemas/WebsitePaymentsSchema');
models.WebsiteRefunds = require('./schemas/WebsiteRefundsSchema');
models.BotUpvote = require('./schemas/BotUpvoteSchema');
models.RelatedAlbum = require('./schemas/RelatedAlbumSchema');
models.HiddenPost = require('./schemas/HiddenPostSchema');
models.HiddenComment = require('./schemas/HiddenCommentSchema');
models.MutedUser = require('./schemas/MutedUserSchema');
models.Blacklist = require('./schemas/BlacklistSchema');
models.GeoIp = require('./schemas/GeoIpSchema');
models.VipTicket = require('./schemas/VipTicketSchema');
models.Prefetch = require('./schemas/PrefetchSchema');
models.EngineAccountHistory = require('./schemas/EngineAccountHistorySchema');
models.WalletExemptions = require('./schemas/WalletExemptionsSchema');
models.GuestWallet = require('./schemas/GuestWalletSchema');
models.PageDraft = require('./schemas/PageDraftSchema');
models.Department = require('./schemas/DepartmentSchema');
models.CampaignPosts = require('./schemas/CampaignPostsSchema');
models.AppAffiliate = require('./schemas/AppAffiliateSchema');
models.SponsorsUpvote = require('./schemas/SponsorsUpvoteSchema');
models.UserShopDeselect = require('./schemas/UserShopDeselectSchema');
models.WithdrawFunds = require('./schemas/WithdrawFundsSchema');

module.exports = {
  Mongoose: mongoose,
  models,
  closeMongoConnections,
};
