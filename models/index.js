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

module.exports = moduleExports;
