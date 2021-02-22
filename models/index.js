const moduleExports = {};

moduleExports.ObjectType = require('./ObjectTypeModel');
moduleExports.UserWobjects = require('./UserWobjects');
moduleExports.CommentRef = require('./CommentRef');
moduleExports.Comment = require('./CommentModel');
moduleExports.Wobj = require('./wObjectModel');
moduleExports.User = require('./UserModel');
moduleExports.Post = require('./PostModel');
moduleExports.App = require('./AppModel');
moduleExports.Campaign = require('./CampaignModel');
moduleExports.paymentHistory = require('./paymentHistoryModel');
moduleExports.Subscriptions = require('./SubscriptionModel');
moduleExports.wobjectSubscriptions = require('./wobjectSubscriptionModel');
moduleExports.websitePayments = require('./websitePaymentsModel');
moduleExports.websiteRefunds = require('./websiteRefundsModel');
moduleExports.botUpvoteModel = require('./botUpvoteModel');
moduleExports.relatedAlbum = require('./relatedAlbumModel');
moduleExports.hiddenPostModel = require('./hiddenPostModel');
moduleExports.hiddenCommentModel = require('./hiddenCommentModel');
moduleExports.mutedUserModel = require('./mutedUserModel');
moduleExports.blacklistModel = require('./blacklistModel');
moduleExports.geoIpModel = require('./geoIpModel');

module.exports = moduleExports;
