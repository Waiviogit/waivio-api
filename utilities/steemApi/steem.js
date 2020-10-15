const { Client } = require('@hiveio/dhive');
const config = require('config');

const steemUrl = config.nodeUrl || 'https://anyx.io';
const options = { timeout: 8 * 1000, failoverThreshold: 4, rebrandedApi: true };

const client = new Client(steemUrl, options);
const clientAnyx = new Client('https://anyx.io', options);

module.exports = { client, clientAnyx };
