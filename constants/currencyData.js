const { SUPPORTED_CURRENCIES } = require('./common');

exports.SUPPORTED_CRYPTO_CURRENCIES = {
  WAIV: 'WAIV',
  HIVE: 'HIVE',
};

exports.RATE_CURRENCIES = [
  SUPPORTED_CURRENCIES.CAD,
  SUPPORTED_CURRENCIES.EUR,
  SUPPORTED_CURRENCIES.AUD,
  SUPPORTED_CURRENCIES.MXN,
  SUPPORTED_CURRENCIES.GBP,
  SUPPORTED_CURRENCIES.JPY,
  SUPPORTED_CURRENCIES.CNY,
  SUPPORTED_CURRENCIES.RUB,
  SUPPORTED_CURRENCIES.UAH,
];

exports.BASE_CURRENCIES = [
  SUPPORTED_CURRENCIES.USD,
];

exports.STATISTIC_RECORD_TYPES = {
  ORDINARY: 'ordinaryData',
  DAILY: 'dailyData',
};

exports.RATE_HIVE_ENGINE = [
  this.SUPPORTED_CRYPTO_CURRENCIES.HIVE,
  SUPPORTED_CURRENCIES.USD,
];

exports.USD_PRECISION = 14;