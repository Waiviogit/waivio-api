exports.PAYMENT_HISTORIES_TYPES = {
  REVIEW: 'review',
  TRANSFER: 'transfer',
  CAMPAIGNS_SERVER_FEE: 'campaign_server_fee',
  REFERRAL_SERVER_FEE: 'referral_server_fee',
  BENEFICIARY_FEE: 'beneficiary_fee',
  INDEX_FEE: 'index_fee',
  DEMO_POST: 'demo_post',
  DEMO_USER_TRANSFER: 'demo_user_transfer',
  DEMO_DEBT: 'demo_debt',
  USER_TO_GUEST_TRANSFER: 'user_to_guest_transfer',
  COMPENSATION_FEE: 'compensation_fee',
  OVERPAYMENT_REFUND: 'overpayment_refund',
};

exports.CAMPAIGN_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  DELETED: 'deleted',
  PAYED: 'payed',
  REACHED_LIMIT: 'reachedLimit',
  ON_HOLD: 'onHold',
  SUSPENDED: 'suspended',
};

exports.CAMPAIGN_TYPES = {
  REVIEWS: 'reviews',
};

exports.RESERVATION_STATUSES = {
  ASSIGNED: 'assigned',
  UNASSIGNED: 'unassigned',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

exports.BOT_UPVOTE_STATUSES = {
  UPVOTED: 'upvoted',
  PENDING: 'pending',
};
