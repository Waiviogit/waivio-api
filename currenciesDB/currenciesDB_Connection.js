const mongoose = require('mongoose');
const config = require('config');

const URI = `mongodb://${config.currenciesDB.host}:${config.currenciesDB.port}/${config.currenciesDB.database}`;

module.exports = mongoose.createConnection(URI, {
  useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false,
},
() => console.log('CurrenciesDB connection successful!'));
