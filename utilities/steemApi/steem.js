const { Client } = require('@hiveio/dhive');

const hiveUrls = ['https://rpc.esteem.app', 'https://api.openhive.network', 'https://hive.roelandp.nl', 'https://hive-api.arcange.eu'];
const options = { timeout: 8 * 1000, failoverThreshold: 4, rebrandedApi: true };

const client = new Client(hiveUrls, options);

module.exports = { client };
