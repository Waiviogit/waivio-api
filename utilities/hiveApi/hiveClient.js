const { NODE_URLS } = require('constants/requestData');
const { Client } = require('@hiveio/dhive');

exports.postClient = new Client(NODE_URLS, { failoverThreshold: 0, timeout: 10 * 1000 });
exports.userClient = new Client(NODE_URLS, { failoverThreshold: 0, timeout: 10 * 1000 });
exports.currencyClient = new Client(NODE_URLS, { failoverThreshold: 0, timeout: 10 * 1000 });
