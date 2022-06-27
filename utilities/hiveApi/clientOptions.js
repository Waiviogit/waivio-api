const { redisGetter } = require('utilities/redis');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { NODE_URLS } = require('constants/requestData');
const { Client } = require('@hiveio/dhive');

exports.getPostNodes = async (key) => {
  const result = await redisGetter.getHashAll({ key });
  if (!result) return NODE_URLS;
  const nodes = jsonHelper.parseJson(result.nodes, null);
  if (!nodes) return NODE_URLS;
  return nodes;
};

exports.getClient = async (key) => {
  const nodes = await this.getPostNodes(key);
  return new Client(nodes, { failoverThreshold: 0, timeout: 10000 });
};
