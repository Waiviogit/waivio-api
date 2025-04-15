const { DEVICE } = require('../../constants/common');
const asyncLocalStorage = require('./context');

const isMobileDevice = () => asyncLocalStorage.getStore()?.get('device') === DEVICE.MOBILE;

module.exports = {
  isMobileDevice,
};
