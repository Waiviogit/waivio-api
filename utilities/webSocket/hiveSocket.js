const WebSocket = require('ws');
const EventEmitterHIVE = require('events').EventEmitter;
const _ = require('lodash');
const jsonHelper = require('../helpers/jsonHelper');

const emitter = new EventEmitterHIVE();

const HIVE_SOCKET = 'wss://blocks.waivio.com:8084';

const REQUESTS_TO_DISABLE = 15;
const REQUESTS_TO_RENEW = 3000;

const HIVE_SOCKET_ERR = {
  ERROR: 'error socket closed',
  DISABLED: 'socket disabled',
  CLOSED: 'connection close',
  TIMEOUT: 'Timeout exceed',
};

/**
 * Not using reject in order not to wrap an instance of the class in a try catch
 */
class SocketClient {
  constructor(url) {
    this.url = url;
    this.timeoutCount = 0;
  }

  async init() {
    return new Promise((resolve) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('error', () => {
        console.error('error socket closed');
        this.ws.close();
        resolve({ error: new Error(HIVE_SOCKET_ERR.ERROR) });
      });

      this.ws.on('message', (message) => {
        const data = jsonHelper.parseJson(message.toString());
        emitter.emit(data.id, { data, error: data.error });
      });

      this.ws.on('open', () => {
        setTimeout(() => {
          console.info('socket connection open');
          resolve(this.ws);
        }, 100);
      });
    });
  }

  async sendMessage(message = {}) {
    if (process.env.NODE_ENV !== 'production') return { error: new Error(HIVE_SOCKET_ERR.DISABLED) };
    if (this.timeoutCount >= REQUESTS_TO_DISABLE) {
      this.timeoutCount++;
      if (this.timeoutCount > REQUESTS_TO_RENEW) {
        this.timeoutCount = 0;
      }
      return { error: new Error(HIVE_SOCKET_ERR.TIMEOUT) };
    }
    if (_.get(this, 'ws.readyState') !== 1) {
      await this.init();
    }
    return new Promise((resolve) => {
      if (this.ws.readyState !== 1) {
        resolve({ error: new Error(HIVE_SOCKET_ERR.CLOSED) });
      }

      const id = this.getUniqId();
      message.id = id;
      this.ws.send(JSON.stringify(message));
      emitter.once(id, ({ data, error }) => {
        if (error) resolve({ error });
        resolve(data);
      });

      setTimeout(() => {
        if (emitter.eventNames().includes(id)) {
          this.timeoutCount++;
          emitter.off(id, () => {});
          resolve({ error: new Error(HIVE_SOCKET_ERR.TIMEOUT) });
        }
      }, 2 * 1000);
    });
  }

  getUniqId() {
    return `${Date.now().toString()}#${Math.random().toString(36).substr(2, 9)}`;
  }

  async getBlock(blockNum) {
    const data = await this.sendMessage({
      jsonrpc: '2.0',
      method: 'condenser_api.get_block',
      params: [blockNum],
    });
    if (_.get(data, 'error')) {
      return { error: data.error };
    }
    return data.result;
  }

  async getOpsInBlock(blockNum) {
    const data = await this.sendMessage({
      jsonrpc: '2.0',
      method: 'account_history_api.get_ops_in_block',
      params: {
        block_num: blockNum,
        only_virtual: false,
      },
    });
    if (_.get(data, 'error')) {
      return { error: data.error };
    }
    return data.result;
  }

  async getAccounts(accounts = []) {
    const data = await this.sendMessage({
      jsonrpc: '2.0',
      method: 'condenser_api.get_accounts',
      params: [_.compact(accounts)],
      id: 1,
    });
    if (_.get(data, 'error')) {
      return { error: data.error };
    }
    return data.result;
  }

  async getAccountHistory({
    name, id, limit, filterLow, filterHigh,
  }) {
    const data = await this.sendMessage({
      jsonrpc: '2.0',
      method: 'condenser_api.get_account_history',
      params: _.compact([name, id, limit, filterLow, filterHigh]),
    });
    if (_.get(data, 'error')) {
      return { error: data.error };
    }
    return data.result;
  }
}

const socketHiveClient = new SocketClient(HIVE_SOCKET);

module.exports = {
  socketHiveClient,
  HIVE_SOCKET_ERR,
};
