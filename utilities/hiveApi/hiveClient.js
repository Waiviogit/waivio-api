const _ = require('lodash');
const HIVE = require('@hiveio/dhive');
const { NODE_URLS } = require('constants/requestData');
const { DONT_SWITCH_CLIENT_ERR, NETWORK_TIMEOUT } = require('constants/regExp');

const hiveClients = (() => {
  const clients = [];
  for (const node of NODE_URLS) {
    clients.push(new HIVE.Client(node, { timeout: 8 * 1000 }));
  }
  return clients;
})();

const reloadClients = () => {
  hiveClients.length = 0;
  for (const node of NODE_URLS) {
    hiveClients.push(new HIVE.Client(node, { timeout: 8 * 1000 }));
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
      if (NETWORK_TIMEOUT.test(_.get(data, 'error.message', ''))) {
        reloadClients();
        console.log('---------------renew clients');
      }
      return { error: data.error };
    }
    if (data.error && DONT_SWITCH_CLIENT_ERR.test(_.get(data, 'error.message', ''))) {
      return { error: data.error };
    }
    this.client = await getHiveClient(this.client);
  }
};
