exports.redisStatisticsKey = 'siteUsers';
exports.SITE_NAME_REGEX = /^[a-z,0-9]+$/;
exports.TRANSFER_ID = 'websitesPayment';
exports.TRANSFER_GUEST_ID = 'websitesPaymentGuest';

exports.STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

exports.SHOP_SETTINGS_TYPE = {
  USER: 'user',
  OBJECT: 'object',
};

exports.CAN_DELETE_STATUSES = [
  this.STATUSES.INACTIVE,
  this.STATUSES.PENDING,
  this.STATUSES.SUSPENDED,
];

exports.INACTIVE_STATUSES = [
  this.STATUSES.SUSPENDED,
  this.STATUSES.INACTIVE,
  this.STATUSES.PENDING,
];

exports.TEST_DOMAINS = [
  'dinings.pp.ua',
  'dinings.club',
  'dining.pp.ua',
  'socialgifts.pp.ua',
];

exports.SOCIAL_HOSTS = ['social.gifts', 'socialgifts.pp.ua', 'localhost:4000'];

exports.PAYMENT_TYPES = {
  TRANSFER: 'transfer',
  CREDIT: 'credit', // special type admin can give credits to site
  WRITE_OFF: 'writeOff',
  REFUND: 'refund',
};

exports.POSITIVE_SUM_TYPES = [this.PAYMENT_TYPES.TRANSFER, this.PAYMENT_TYPES.CREDIT];

exports.REFUND_TYPES = {
  WEBSITE_REFUND: 'website_refund',
};

exports.REFUND_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  FROZEN: 'frozen',
};

exports.FEE = {
  minimumValue: 1,
  currency: 'HBD',
  perUser: 0.005,
  account: 'waivio.web',
  id: JSON.stringify({ id: this.TRANSFER_ID }),
  idGuest: JSON.stringify({ id: this.TRANSFER_GUEST_ID }),
  perInactive: 0.2,
};

exports.SUPPORTED_COLORS = {
  BACKGROUND: 'background',
  FONT: 'font',
  HOVER: 'hover',
  HEADER: 'header',
  BUTTON: 'button',
  BORDER: 'border',
  FOCUS: 'focus',
  LINKS: 'links',
  MAP_MARKER_BODY: 'mapMarkerBody',
  MAP_MARKER_TEXT: 'mapMarkerText',
};

exports.GET_DEFAULT_COLORS = () => {
  const colors = {};
  Object.values(this.SUPPORTED_COLORS).forEach((color) => { colors[color] = null; });
  return colors;
};

exports.NOTIFICATION = {
  WARNING: 'Warning: website account balance may run out in',
  ATTENTION: 'Attention! All your websites are now suspended due to the negative balance on your website account',
  BALANCE_ID: 'webSiteBalance',
  SUSPENDED: 'website_account_suspended',
  OUT_THREE_MONTHS: 'balance_run_out_three_months',
  OUT_TWO_MONTHS: 'balance_run_out_two_months',
  OUT_MONTH: 'balance_run_out_month',
  OUT_THREE_WEEKS: 'balance_run_out_three_weeks',
  OUT_TWO_WEEKS: 'balance_run_out_two_weeks',
  OUT_WEEK: 'balance_run_out_week',
  OUT_SIX_DAYS: 'balance_run_out_six_days',
  OUT_FIVE_DAYS: 'balance_run_out_five_days',
  OUT_FOUR_DAYS: 'balance_run_out_four_days',
  OUT_THREE_DAYS: 'balance_run_out_three_days',
  OUT_TWO_DAYS: 'balance_run_out_two_days',
  OUT_DAY: 'balance_run_out_day',
};

exports.PAYMENT_DESCRIPTION = {
  HOSTING_FEE: 'hosting fee',
  RESERVATION: 'reservation',
};

exports.PAYMENT_FIELDS_TRANSFER = ['userName', 'balance', 'createdAt', 'amount', 'type', 'transferTo', '_id', 'description'];

exports.PAYMENT_FIELDS_WRITEOFF = ['userName', 'balance', 'host', 'createdAt', 'amount', 'type', 'countUsers', 'description', '_id'];

exports.REQUIRED_FIELDS_UPD_WOBJ = ['host', 'inherited', 'canBeExtended', 'authority', 'mapCoordinates', 'object_filters', 'supported_object_types'];

exports.FIRST_LOAD_FIELDS = [
  'supported_object_types',
  'googleAnalyticsTag',
  'googleGSCTag',
  'configuration',
  'beneficiary',
  'parentHost',
  'mainPage',
  'currency',
  'language',
  'status',
  'host',
  'owner',
];

exports.WEBSITE_SUSPENDED_COUNT = 'website_suspended_count';

exports.CATEGORY_ITEMS = ['Cuisine', 'Features', 'Good+For', 'Ingredients', 'Category'];

exports.DEFAULT_REFERRAL = 'waivio.referrals';
exports.BILLING_TYPE = {
  CRYPTO: 'crypto',
  PAYPAL_SUBSCRIPTION: 'paypal_subscription',
};
