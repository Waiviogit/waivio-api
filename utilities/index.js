const noroutine = require('noroutine');

const postUtilHIVE = require('./hiveApi/postsUtil');
const userUtilHIVE = require('./hiveApi/userUtil');
const currencyUtilHIVE = require('./hiveApi/currencyUtil');
const accountHistoryENGINE = require('./hiveEngine/accountHistory');
const commentContractENGINE = require('./hiveEngine/commentContract');
const marketPoolsENGINE = require('./hiveEngine/marketPools');
const tokensContractENGINE = require('./hiveEngine/tokensContract');

const noroutineModules = [
  postUtilHIVE,
  userUtilHIVE,
  currencyUtilHIVE,
  accountHistoryENGINE,
  commentContractENGINE,
  marketPoolsENGINE,
  tokensContractENGINE,
];

noroutine.init({
  modules: noroutineModules,
  pool: 2, // number of workers in thread pool
  wait: 2000, // maximum delay to wait for a free thread
  timeout: 6000, // maximum timeout for executing a functions
  monitoring: 6000, // event loop utilization monitoring interval
});

const moduleExports = {};

moduleExports.hiveApi = require('./hiveApi');
moduleExports.helpers = require('./helpers');

module.exports = moduleExports;
