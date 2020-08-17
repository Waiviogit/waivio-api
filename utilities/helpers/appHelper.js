const { App } = require('models');

exports.getApp = async (name) => App.getOne({ name });
