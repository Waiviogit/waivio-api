const _ = require('lodash');
const BigNumber = require('bignumber.js');

exports.add = (...args) => _.reduce(args, (value, element) => (
  new BigNumber(value).plus(element)), new BigNumber(0)).toNumber();
