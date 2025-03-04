const { redisGetter } = require('../redis');
const jsonHelper = require('../helpers/jsonHelper');
const { NODE_URLS } = require('../../constants/requestData');
const { Client } = require('@hiveio/dhive');
const { REDIS_KEYS } = require('../../constants/common');

const clients = {}; // An object to store clients by key

exports.getPostNodes = async (key) => {
  const result = await redisGetter.getHashAll({ key });
  if (!result) return NODE_URLS;
  const nodes = jsonHelper.parseJson(result.nodes, null);
  if (!nodes) return NODE_URLS;
  return nodes;
};

const getClient = async (key) => {
  if (clients[key]) {
    // If a client already exists for the key, return it
    return clients[key];
  }

  const nodes = await this.getPostNodes(key);
  const client = new Client(nodes, { failoverThreshold: 0, timeout: 10000 });

  // Store the client with the key
  clients[key] = client;

  // Set a timeout to delete the client after 2 hours
  setTimeout(() => {
    delete clients[key];
  }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds

  return client;
};

exports.getRegularClient = async () => getClient(REDIS_KEYS.TEST_LOAD.POST);

exports.getHistoryClient = async () => getClient(REDIS_KEYS.TEST_LOAD.HISTORY);
