const { getNamespace } = require('cls-hooked');
const { App } = require('models');

exports.getApp = async () => {
  const session = getNamespace('request-session');
  const host = session.get('host');
  return App.findOne({ host });
};
