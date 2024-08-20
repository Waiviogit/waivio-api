const { App } = require('models');
const asyncLocalStorage = require('../../middlewares/context/context');

exports.getApp = async () => {
  const store = asyncLocalStorage.getStore();
  const host = store.get('host');
  return App.findOne({ host });
};
