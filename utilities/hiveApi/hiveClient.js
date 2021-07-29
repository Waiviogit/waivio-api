const _ = require('lodash');
const HIVE = require('@hiveio/dhive');
const { NODE_URLS } = require('constants/requestData');

const hiveClients = (() => {
  const clients = [];
  for (const node of NODE_URLS) {
    clients.push(new HIVE.Client(node, {
      timeout: 8 * 1000, failoverThreshold: 1, rebrandedApi: true,
    }));
  }
  return clients;
})();

const reloadClients = () => {
  hiveClients.length = 0;
  for (const node of NODE_URLS) {
    hiveClients.push(new HIVE.Client(node, {
      timeout: 8 * 1000, failoverThreshold: 1, rebrandedApi: true,
    }));
  }
};

const getHiveClient = (hiveClient) => {
  if (!hiveClient) return hiveClients[0];
  const currentClientIndex = _.findIndex(hiveClients,
    (client) => client.currentAddress === hiveClient.currentAddress);
  return hiveClients[currentClientIndex === hiveClients.length - 1 ? 0 : currentClientIndex + 1];
};

exports.client = getHiveClient();

exports.execute = async (method, params) => {
  for (let i = 0; i < hiveClients.length; i++) {
    const data = await method(this.client, params);
    if (!_.get(data, 'error')) return data;
    if (i === hiveClients.length - 1) {
      reloadClients();
      console.log('---------------renew clients');
      return { error: data.error };
    }
    if (data.error) {
      console.log('---------------switch client');
      this.client = await getHiveClient(this.client);
    }
  }
};
