const config = require('../config');
const jsonDocFile = require('./mainDoc');

jsonDocFile.host = config.swaggerHost;
// ////////////////////////////////// //
// put here additional configurations //
// ////////////////////////////////// //

module.exports = jsonDocFile;
