const mongoose = require('mongoose');
const config = require('../config');

const URI = process.env.MONGO_URI_CURRENCIES
  ? process.env.MONGO_URI_CURRENCIES
  : `mongodb://${config.currenciesDB.host}:${config.currenciesDB.port}/${config.currenciesDB.database}`;

const connectionOptions = {
  maxPoolSize: 50,
  socketTimeoutMS: 60000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  bufferCommands: false,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
};

const currenciesDb = mongoose.createConnection(URI, connectionOptions);

currenciesDb.on('error', console.error.bind(console, 'connection error:'));
currenciesDb.once('open', () => {
  console.log(`${config.currenciesDB.database} connected`);
});

currenciesDb.on('close', () => console.log(`closed ${config.currenciesDB.database}`));

module.exports = currenciesDb;
