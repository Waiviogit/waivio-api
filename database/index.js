const mongoose = require('mongoose');
const config = require('config');

const URI = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;

mongoose.connect(URI, {
  useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false,
})
  .then(() => console.log('connection successful!'))
  .catch((error) => console.log(error));

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

mongoose.Promise = global.Promise;
mongoose.set('debug', process.env.NODE_ENV === 'development');

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

module.exports = {
  Mongoose: mongoose,
  models,
};
