const mongoose = require('mongoose');
const config = require('config');

const URI = `mongodb://${config.currenciesDB.host}:${config.currenciesDB.port}/${config.currenciesDB.database}`;

module.exports = mongoose.createConnection(URI, {
  useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true,
},
() => console.log('CurrenciesDB connection successful!'));
