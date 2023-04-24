const _ = require('lodash');
const BigNumber = require('bignumber.js');

exports.add = (...args) => _.reduce(args, (value, element) => (
  new BigNumber(value).plus(element)), new BigNumber(0)).toNumber();

exports.roundToEven = (num) => {
  let rounded = Math.round(num);
  if (rounded % 2 !== 0) { // if the rounded value is odd
    rounded += (num > 0) ? 1 : -1; // add or subtract 1 to make it even
  }
  return rounded;
};
