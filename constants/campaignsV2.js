exports.CAMPAIGN_PAYMENT = Object.freeze({
  REVIEW: 'review',
  CAMPAIGNS_SERVER_FEE: 'campaignServerFee',
  REFERRAL_SERVER_FEE: 'referralServerFee',
  BENEFICIARY_FEE: 'beneficiaryFee',
  INDEX_FEE: 'indexFee',
  COMPENSATION_FEE: 'compensationFee',
  OVERPAYMENT_REFUND: 'overpaymentRefund', // ?
  TRANSFER: 'transfer',
  TRANSFER_TO_GUEST: 'transferToGuest',
});

exports.PAYOUT_TOKEN = Object.freeze({
  HIVE: 'HIVE',
  WAIV: 'WAIV',
});

exports.CP_TRANSFER_TYPES = [
  this.CAMPAIGN_PAYMENT.TRANSFER,
  this.CAMPAIGN_PAYMENT.TRANSFER_TO_GUEST,
];
