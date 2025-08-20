const BigNumber = require('bignumber.js');
const Sentry = require('@sentry/node');
const moment = require('moment');
const _ = require('lodash');
const dns = require('dns/promises');
const {
  PAYMENT_TYPES, FEE, TEST_DOMAINS, PAYMENT_FIELDS_TRANSFER, SOCIAL_HOSTS,
  PAYMENT_FIELDS_WRITEOFF, REQUIRED_FIELDS_UPD_WOBJ, FIRST_LOAD_FIELDS,
  DEFAULT_REFERRAL, STATUSES,
  POSITIVE_SUM_TYPES,
} = require('../../constants/sitesConstants');
const {
  App, websitePayments, User, Wobj, geoIpModel,
} = require('../../models');
const {
  FIELDS_NAMES, REQUIREDFIELDS_SEARCH, PICK_FIELDS_ABOUT_OBJ, DEFAULT_COUNTRY_CODE,
} = require('../../constants/wobjectsData');
const { sendSentryNotification } = require('./sentryHelper');
const { processWobjects } = require('./wObjectHelper');
const { redisGetter } = require('../redis');
const ipRequest = require('../requests/ipRequest');
const asyncLocalStorage = require('../../middlewares/context/context');
const { SHOP_SETTINGS_TYPE } = require('../../constants/sitesConstants');
const { parseJson } = require('./jsonHelper');
const { isMobileDevice } = require('../../middlewares/context/contextHelper');

/** Check for available domain for user site */
exports.availableCheck = async ({ parentId, name, host }) => {
  let app;
  const { result: parent } = await App.findOne({ _id: parentId, canBeExtended: true });
  if (!parent) return { error: { status: 404, message: 'Parent not found' } };
  if (host) {
    ({ result: app } = await App.findOne({ host }));
  } else {
    ({ result: app } = await App.findOne({ host: `${name}.${parent.host}` }));
  }
  if (app) return { error: { status: 409, message: 'Subdomain already exists' } };
  return { result: true, parent };
};

/** Check for cloudflare NS servers */
exports.checkNs = async ({ host }) => {
  try {
    const nServers = await dns.resolveNs(host);
    const [ns1, ns2] = nServers;
    const cloudflareNs = ns1.endsWith('cloudflare.com') && ns2.endsWith('cloudflare.com');
    if (!cloudflareNs) return { error: { status: 400, message: 'DNS are not cloudflare' } };
    return { result: true };
  } catch (error) {
    return { error: { status: 400, message: 'Can\'t resolve DNS, make sure the domain has DNS configured' } };
  }
};

/** Get list of all parents available for extend */
exports.getParentsList = async () => {
  const condition = process.env.NODE_ENV === 'production'
    ? { canBeExtended: true, host: { $nin: TEST_DOMAINS } }
    : { canBeExtended: true };

  const { result: parents, error } = await App.find(condition, { host: -1 });
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

  return {
    result: _.map(apps, (app) => ({
      host: app.host,
      id: app._id,
      parentHost: app?.parentHost ?? '',
    })),
  };
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

exports.getParentHost = async ({ host }) => {
  const { result, error } = await App.findOne({
    host,
  });
  if (error) return { error };
  return { result: result?.parentHost ?? '' };
};

exports.getPaymentsTable = (payments) => {
  let payable = 0;
  payments = _.map(payments, (payment) => {
    switch (payment.type) {
      case PAYMENT_TYPES.TRANSFER:
      case PAYMENT_TYPES.CREDIT:
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
  return {
    user,
    memo: FEE.id,
    guestMemo: FEE.idGuest,
  };
};

exports.getWebsiteData = (payments, site) => {
  const lastWriteOff = _.filter(payments, (payment) => payment.host === site.host
      && payment.type === PAYMENT_TYPES.WRITE_OFF
      && payment.createdAt > moment.utc().subtract(7, 'day').startOf('day').toDate());

  return {
    status: site.status,
    name: site.name,
    host: site.host,
    parent: site?.parentHost ?? '',
    createdAt: site.createdAt,
    useForCanonical: !!site.useForCanonical,
    billingType: site.billingType,
    averageDau: lastWriteOff.length
      ? Math.trunc(_.meanBy(lastWriteOff, (writeOff) => writeOff.countUsers))
      : 0,
  };
};

exports.siteInfo = async (host) => {
  const { result: app } = await App.findOne({ host, inherited: true });
  if (!app) {
    return { error: { status: 404, message: 'App not found!' } };
  }

  return {
    result: {
      status: app.status,
      parentHost: app.parentHost,
    },
  };
};

exports.firstLoad = async ({ app }) => {
  if (!app) {
    return {
      result: {
        aboutObject: {},
      },
    };
  }
  app = await this.aboutObjectFormat(app);

  return {
    result: {
      ..._.pick(app, FIRST_LOAD_FIELDS),
      administrators: [app.owner, ...app.admins],
    },
  };
};

exports.getSessionApp = async () => {
  const store = asyncLocalStorage.getStore();
  const host = store.get('host');

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

const getDefaultRefferal = (account = '') => {
  if (account.includes('_')) return DEFAULT_REFERRAL;
  return account;
};

exports.getSettings = async (host) => {
  const { result: app } = await App.findOne({ host });
  if (!app) return { error: { status: 404, message: 'App not found!' } };
  const {
    googleAnalyticsTag,
    googleGSCTag = '',
    googleEventSnippet = '',
    googleAdsConfig = '',
    beneficiary,
    app_commissions,
    currency,
    language,
    objectControl,
    mapImportTag = '',
    disableOwnerAuthority = false,
    verificationTags = [],
  } = app;

  const result = {
    googleAnalyticsTag,
    googleGSCTag,
    googleEventSnippet,
    googleAdsConfig,
    beneficiary,
    referralCommissionAcc: app_commissions?.referral_commission_acc
      ? app_commissions.referral_commission_acc
      : getDefaultRefferal(app.owner),
    currency,
    language,
    objectControl,
    mapImportTag,
    disableOwnerAuthority,
    verificationTags,
  };

  return { result };
};

exports.aboutObjectFormat = async (app) => {
  const aboutObject = app?.configuration?.aboutObject;
  const defaultHashtag = app?.configuration?.defaultHashtag;
  const { result: wobjects } = await Wobj
    .findObjects({ filter: { author_permlink: { $in: [aboutObject, defaultHashtag] } } });

  const processed = await processWobjects({
    wobjects, returnArray: true, fields: REQUIREDFIELDS_SEARCH, app, mobile: isMobileDevice(),
  });
  if (!processed.length) return app;
  const aboutObjectProcessed = processed.find((el) => el.author_permlink === aboutObject);
  if (aboutObjectProcessed) {
    app.configuration.aboutObject = _.pick(aboutObjectProcessed, PICK_FIELDS_ABOUT_OBJ);
  }
  const defaultHashtagProcessed = processed.find((el) => el.author_permlink === defaultHashtag);
  if (defaultHashtagProcessed) {
    app.configuration.defaultHashtag = _.pick(defaultHashtagProcessed, PICK_FIELDS_ABOUT_OBJ);
  }

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

exports.getCountryCodeFromIp = async (ip) => {
  const defaultCode = DEFAULT_COUNTRY_CODE;
  if (!ip) return defaultCode;
  const { result } = await geoIpModel.findOne(ip);
  if (_.get(result, 'countryCode')) return result.countryCode;

  const {
    geoData,
    error,
  } = await ipRequest.getIp(ip);
  if (error) return defaultCode;
  if (!geoData.countryCode) return defaultCode;

  await geoIpModel.findOneAndUpdate({
    ip,
    latitude: parseFloat(_.get(geoData, 'lat') || '0'),
    longitude: parseFloat(_.get(geoData, 'lon') || '0'),
    countryCode: geoData.countryCode,
  });
  return geoData.countryCode;
};

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

exports.getSumByPaymentType = (payments, types) => _
  .chain(payments)
  .filter((el) => types.includes(el.type))
  .reduce((acc, payment) => new BigNumber(payment.amount).plus(acc), new BigNumber(0))
  .value();

exports.checkForSocialSite = (host = '') => SOCIAL_HOSTS.some((sh) => host.includes(sh));

exports.getAdSense = async ({ host }) => {
  const { result } = await App.findOne({ host });

  return {
    code: result?.adSense?.code || '',
    level: result?.adSense?.level || '',
    txtFile: result?.adSense?.txtFile || '',
    displayUnitCode: result?.adSense?.displayUnitCode || '',
  };
};

exports.getDescription = async ({ app }) => {
  const userSite = app?.configuration?.shopSettings?.type === SHOP_SETTINGS_TYPE.USER;
  if (userSite) {
    const userName = app?.configuration?.shopSettings?.value;
    const { user } = await User.getOne(userName);

    const parsedData = parseJson(user?.posting_json_metadata, null);
    if (!parsedData) return '';
    return { result: parsedData?.profile?.about ?? '' };
  }

  const objectPermlink = app?.configuration?.shopSettings?.value;
  if (!objectPermlink) return { result: '' };

  const { wObject } = await Wobj.getOne(objectPermlink);
  if (!wObject) return { result: '' };

  const processed = await processWobjects({
    wobjects: [wObject], returnArray: false, fields: REQUIREDFIELDS_SEARCH, app, mobile: isMobileDevice(),
  });

  return { result: processed.description ?? '' };
};

exports.getAllActiveSites = async () => {
  const { result, error } = await App.find(
    {
      status: STATUSES.ACTIVE,
      host: { $not: { $regex: /^localhost/ } },
    },
    { _id: -1 },
    {
      host: 1,
      _id: 0,
    },
  );
  if (error) return { error };

  return { result };
};

exports.checkOwnerBalance = async (owner) => {
  const { error, payments } = await this.getWebsitePayments({ owner });
  if (error) return { error };

  const balance = this.getSumByPaymentType(payments, POSITIVE_SUM_TYPES)
    .minus(this.getSumByPaymentType(payments, [PAYMENT_TYPES.WRITE_OFF]))
    .toNumber();

  return { balance };
};
