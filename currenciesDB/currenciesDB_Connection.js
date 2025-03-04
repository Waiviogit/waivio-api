const mongoose = require('mongoose');
const config = require('../config');

const URI = process.env.MONGO_URI_CURRENCIES
  ? process.env.MONGO_URI_CURRENCIES
  : `mongodb://${config.currenciesDB.host}:${config.currenciesDB.port}/${config.currenciesDB.database}`;

const currenciesDb = mongoose.createConnection(URI);
currenciesDb.on('error', console.error.bind(console, 'connection error:'));
currenciesDb.once('open', () => {
  console.log(`${config.currenciesDB.database} connected`);
});

currenciesDb.on('close', () => console.log(`closed ${config.currenciesDB.database}`));

module.exports = currenciesDb;
