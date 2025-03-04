const { NODE_URLS } = require('../../constants/requestData');
const { Client } = require('@hiveio/dhive');

const options = { failoverThreshold: 0, consoleOnFailover: true, timeout: 10 * 1000 };

exports.postClient = new Client(NODE_URLS, options);
exports.userClient = new Client(NODE_URLS, options);
exports.currencyClient = new Client(NODE_URLS, options);
