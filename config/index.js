const config = require('./config.json');

module.exports = config[process.env.NODE_ENV || 'development'];
