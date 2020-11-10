const { Client } = require('@hiveio/dhive');
const config = require('config');

const hiveUrls = config.nodeUrls || 'https://api.hive.blog';
const options = { timeout: 8 * 1000, failoverThreshold: 4, rebrandedApi: true };

const client = new Client(hiveUrls, options);
const clientAnyx = new Client(hiveUrls, options);
module.exports = { client, clientAnyx };
