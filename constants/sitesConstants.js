exports.redisStatisticsKey = 'siteUsers';
exports.SITE_NAME_REGEX = /^[a-z,0-9]+$/;
exports.TRANSFER_ID = 'websitesPayment';

exports.STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

exports.CAN_DELETE_STATUSES = [
  this.STATUSES.INACTIVE,
  this.STATUSES.PENDING,
];

exports.INACTIVE_STATUSES = [
  this.STATUSES.SUSPENDED,
  this.STATUSES.INACTIVE,
  this.STATUSES.PENDING,
];

exports.TEST_DOMAINS = [
  'dining.pp.ua',
];

exports.ACTIVE_STATUSES = [
  this.STATUSES.ACTIVE,
  this.STATUSES.PENDING,
];

exports.PAYMENT_TYPES = {
  TRANSFER: 'transfer',
  WRITE_OFF: 'writeOff',
  REFUND: 'refund',
};

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
  account: 'waivio.hosting',
  id: JSON.stringify({ id: this.TRANSFER_ID }),
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
};

exports.GET_DEFAULT_COLORS = () => {
  const colors = {};
  Object.values(this.SUPPORTED_COLORS).forEach((color) => colors[color] = null);
  return colors;
};

exports.NOTIFICATION = {
  WARNING: 'Warning: website account balance may run out in',
  ATTENTION: 'Attention! All your websites are now suspended due to the negative balance on your website account',
  BALANCE_ID: 'webSiteBalance',
};
