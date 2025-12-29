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

// we use this because noroutine throw an error on timeout in wrapper
const wrapModule = (module) => {
  for (const key of Object.keys(module)) {
    if (typeof module[key] !== 'function') continue;
    const originalFunction = module[key];
    module[key] = async (...args) => {
      try {
        return await originalFunction(...args);
      } catch (error) {
        return { error };
      }
    };
  }
};

for (const module of noroutineModules) {
  wrapModule(module);
}

const moduleExports = {};

moduleExports.hiveApi = require('./hiveApi');
moduleExports.helpers = require('./helpers');

module.exports = moduleExports;
