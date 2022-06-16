const mongoose = require('mongoose');

mongoose.set('debug', process.env.NODE_ENV === 'development');

const models = {};
models.CurrenciesRate = require('./schemas/CurrenciesRateSchema');
models.HiveEngineRate = require('./schemas/HiveEngineRateSchema');

module.exports = {
  models,
};
