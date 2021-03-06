const {
  PAYMENT_TYPES, FEE, TEST_DOMAINS, PAYMENT_FIELDS_TRANSFER,
  PAYMENT_FIELDS_WRITEOFF, REQUIRED_FIELDS_UPD_WOBJ, FIRST_LOAD_FIELDS,
} = require('constants/sitesConstants');
const {
  App, websitePayments, User, Wobj,
} = require('models');
const { FIELDS_NAMES, REQUIREDFIELDS_SEARCH, PICK_FIELDS_ABOUT_OBJ } = require('constants/wobjectsData');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const { processWobjects } = require('utilities/helpers/wObjectHelper');
const { redisGetter } = require('utilities/redis');
const { getNamespace } = require('cls-hooked');
const BigNumber = require('bignumber.js');
const Sentry = require('@sentry/node');
const moment = require('moment');
const _ = require('lodash');

/** Check for available domain for user site */
exports.availableCheck = async (params) => {
  const { result: parent } = await App.findOne({ _id: params.parentId, canBeExtended: true });
  if (!parent) return { error: { status: 404, message: 'Parent not found' } };
  const { result: app } = await App.findOne({ host: `${params.name}.${parent.host}` });
  if (app) return { error: { status: 409, message: 'Subdomain already exists' } };
  return { result: true, parent };
};

/** Get list of all parents available for extend */
exports.getParentsList = async () => {
  const condition = process.env.NODE_ENV === 'production'
    ? { canBeExtended: true, host: { $nin: TEST_DOMAINS } }
    : { canBeExtended: true };

  const { result: parents, error } = await App.find(condition);
  if (error) return { error };
  return {
    parents: _.map(parents, (parent) => ({ domain: parent.host, _id: parent._id.toString() })),
  };
};

/** Get all user hosts */
exports.getUserApps = async (params) => {
  const { result: apps, error } = await App.find(
    {
      owner: params.userName,
      inherited: true,
    },
    { _id: -1 },
  );
  if (error) return { error };

  return { result: _.map(apps, (app) => ({ host: app.host, id: app._id })) };
};

exports.searchTags = async (params) => {
  const { tags, error } = await redisGetter.getTagCategories({ start: 0, key: `${FIELDS_NAMES.TAG_CATEGORY}:${params.category}`, end: -1 });
  if (error) return { error };
  return { result: _.filter(tags, (tag) => new RegExp(params.string).test(tag)) };
};

exports.getWebsitePayments = async ({
  owner, host, startDate, endDate,
}) => {
  const { result: apps, error: appsError } = await App.find({
    owner, inherited: true,
  }, { _id: -1 });
  if (appsError) return { error: appsError };
  const { result: allExistingApps } = await websitePayments.distinct({ field: 'host', query: { userName: owner } });
  const currentApps = _.map(apps, 'host');
  const ownerAppNames = _.uniq([...currentApps, ...allExistingApps]);

  const condition = host
    ? { host, userName: owner }
    : { userName: owner };

  const { error: paymentError, result: payments } = await websitePayments.find({
    condition: {
      ...condition,
      $and: [
        { createdAt: { $gt: startDate || moment.utc(1).toDate() } },
        { createdAt: { $lt: endDate || moment.utc().toDate() } }],
    },
    sort: { createdAt: 1 },
  });
  if (paymentError) return { error: paymentError };
  return {
    ownerAppNames,
    payments,
    apps,
  };
};

exports.getPaymentsTable = (payments) => {
  let payable = 0;
  payments = _.map(payments, (payment) => {
    switch (payment.type) {
      case PAYMENT_TYPES.TRANSFER:
        payment.balance = BigNumber(payable).plus(payment.amount).toNumber();
        payable = payment.balance;
        return _.pick(payment, PAYMENT_FIELDS_TRANSFER);
      case PAYMENT_TYPES.WRITE_OFF:
      case PAYMENT_TYPES.REFUND:
        payment.balance = BigNumber(payable).minus(payment.amount).toNumber();
        payable = payment.balance;
        return _.pick(payment, PAYMENT_FIELDS_WRITEOFF);
    }
  });
  _.reverse(payments);
  return { payments, payable };
};

exports.getPaymentsData = async () => {
  const { user } = await User.getOne(FEE.account, {
    alias: 1, json_metadata: 1, posting_json_metadata: 1, name: 1,
  });
  return { user, memo: FEE.id };
};

exports.getWebsiteData = (payments, site) => {
  const lastWriteOff = _.filter(payments, (payment) => payment.host === site.host
      && payment.type === PAYMENT_TYPES.WRITE_OFF
      && payment.createdAt > moment.utc().subtract(7, 'day').startOf('day').toDate());

  return {
    status: site.status,
    name: site.name,
    host: site.host,
    parent: site.host.replace(`${site.name}.`, ''),
    averageDau: lastWriteOff.length
      ? Math.trunc(_.meanBy(lastWriteOff, (writeOff) => writeOff.countUsers))
      : 0,
  };
};

exports.siteInfo = async (host) => {
  const { result: app } = await App.findOne({ host, inherited: true });
  if (!app) return { error: { status: 404, message: 'App not found!' } };

  return { result: _.pick(app, ['status']) };
};

exports.firstLoad = async ({ app, redirect }) => {
  app = await this.aboutObjectFormat(app);

  return {
    result: Object.assign(_.pick(app, FIRST_LOAD_FIELDS), { redirect }),
  };
};

exports.getSessionApp = async () => {
  const session = getNamespace('request-session');
  const host = session.get('host');

  return App.findOne({ host });
};

exports.updateSupportedObjects = async ({ host, app }) => {
  if (!app) {
    ({ result: app } = await App.findOne(
      { host },
      REQUIRED_FIELDS_UPD_WOBJ,
    ));
  }

  if (!app) {
    await sendSentryNotification();
    return Sentry.captureException({ error: { message: `Some problems with updateSupportedObject for app ${host}` } });
  }
  if (!(app.inherited && !app.canBeExtended)) return;
  const authorities = _.get(app, 'authority', []);
  const orMapCond = [], orTagsCond = [];
  if (app.mapCoordinates.length) {
    app.mapCoordinates.forEach((points) => {
      orMapCond.push({
        map: {
          $geoWithin: {
            $box: [points.bottomPoint, points.topPoint],
          },
        },
      });
    });
  }
  if (app.object_filters && Object.keys(app.object_filters).length) {
    for (const type of Object.keys(app.object_filters)) {
      const typesCond = [];
      for (const category of Object.keys(app.object_filters[type])) {
        if (app.object_filters[type][category].length) {
          typesCond.push({
            fields: {
              $elemMatch: {
                name: FIELDS_NAMES.CATEGORY_ITEM,
                body: { $in: app.object_filters[type][category] },
                tagCategory: category,
              },
            },
          });
        }
      }
      if (typesCond.length)orTagsCond.push({ $and: [{ object_type: type }, { $or: typesCond }] });
    }
  }
  const condition = {
    $and: [{
      $or: [{
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.ownership', authorities] } },
            0,
          ],
        },
      }, {
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.administrative', authorities] } },
            0,
          ],
        },
      }],
    }],
    object_type: { $in: app.supported_object_types },
  };
  if (orMapCond.length)condition.$and[0].$or.push(...orMapCond);
  if (orTagsCond.length) condition.$and.push({ $or: orTagsCond });

  const { result, error } = await Wobj.find(condition, { author_permlink: 1, _id: 0 });
  if (error) {
    await sendSentryNotification();
    return Sentry.captureException(error);
  }
  await App.findOneAndUpdate({ _id: app._id }, { $set: { supported_objects: _.map(result, 'author_permlink') } });
};

exports.getSettings = async (host) => {
  const { result: app } = await App.findOne({ host });
  if (!app) return { error: { status: 404, message: 'App not found!' } };
  const {
    googleAnalyticsTag, beneficiary, app_commissions, currency,
  } = app;

  return {
    result: {
      googleAnalyticsTag,
      beneficiary,
      referralCommissionAcc: _.get(app_commissions, 'referral_commission_acc')
        ? app_commissions.referral_commission_acc
        : app.owner,
      currency,
    },
  };
};

exports.aboutObjectFormat = async (app) => {
  const { result } = await Wobj.findOne({ author_permlink: _.get(app, 'configuration.aboutObject') });
  if (!result) return app;
  const wobject = await processWobjects({
    wobjects: [result], returnArray: false, fields: REQUIREDFIELDS_SEARCH, app,
  });
  app.configuration.aboutObject = _.pick(wobject, PICK_FIELDS_ABOUT_OBJ);
  return app;
};

/**
 * if production and child site x-forwarded-for - undefined - need to get headers from x-real-ip
 * @param req
 * @returns {*}
 */
exports.getIpFromHeaders = (req) => (process.env.NODE_ENV === 'production'
  ? req.headers['x-forwarded-for'] || req.headers['x-real-ip']
  : req.headers['x-real-ip']);

exports.updateSupportedObjectsTask = async () => {
  const { result: apps } = await App.find(
    { inherited: true, canBeExtended: false },
    {},
    REQUIRED_FIELDS_UPD_WOBJ,
  );
  for (const app of apps) {
    await this.updateSupportedObjects({ app });
  }
};

exports.getSumByPaymentType = (payments, type) => _
  .chain(payments)
  .filter((el) => el.type === type)
  .reduce((acc, payment) => new BigNumber(payment.amount).plus(acc), new BigNumber(0))
  .value();
