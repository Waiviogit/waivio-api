exports.redisStatisticsKey = 'siteUsers';
exports.SITE_NAME_REGEX = /^[a-z,0-9]+$/;
exports.TRANSFER_ID = 'websitesPayment';

exports.STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

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
