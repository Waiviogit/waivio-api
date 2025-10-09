const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');
const moment = require('moment');
const BigNumber = require('bignumber.js');
const {
  EngineAccountHistory, CurrenciesRate, WalletExemptions, HiveEngineRate,
} = require('../../../models');
const {
  SUPPORTED_CURRENCIES,
  REDIS_KEYS,
  TTL_TIME,
} = require('../../../constants/common');
const {
  ADVANCED_WALLET_TYPES, WAIV_OPERATIONS_TYPES, AIRDROP,
  WAIV_DB_OPERATIONS, MARKET_OPERATIONS,
} = require('../../../constants/walletData');
const { accountHistory } = require('../../hiveEngine/accountHistory');
const { STATISTIC_RECORD_TYPES, USD_PRECISION } = require('../../../constants/currencyData');
const { add } = require('../../helpers/calcHelper');
const { cacheWrapperWithTTLRefresh, getCacheKey } = require('../../helpers/cacheHelper');
const { createConfigurableRateLimiter, processWithRateLimit } = require('../../helpers/rateLimiter');

// Timeout wrapper to prevent hanging requests
const withTimeout = (promise, timeoutMs = 30000) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)),
]);

exports.getWalletAdvancedReport = async ({
  accounts, startDate, endDate, limit, filterAccounts, user, currency, symbol, addSwaps,
}) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    // Dynamic timeout based on number of accounts (minimum 30s, +5s per account)
    const timeoutMs = Math.max(30000, 30000 + (accounts.length * 5000));
    console.log(`[${requestId}] Setting timeout to ${timeoutMs}ms for ${accounts.length} accounts`);

    // Add timeout to prevent hanging requests
    accounts = await withTimeout(
      addWalletDataToAccounts({
        filterAccounts, startDate, accounts, endDate, limit, symbol, addSwaps,
      }),
      timeoutMs,
    );

    const error = _.find(accounts, (account) => account.error);
    if (error) {
      // Handle third-party service errors properly
      const actualError = error.error || error;

      // If it's a 503 from external service, pass it through with proper status
      if (actualError?.status === 503 || actualError?.response?.status === 503) {
        const serviceError = new Error('External service temporarily unavailable');
        serviceError.status = 503;
        serviceError.originalError = actualError;
        return { error: serviceError };
      }

      // For other external service errors, provide meaningful messages
      if (actualError?.code === 'ERR_BAD_RESPONSE' || actualError?.response) {
        const serviceError = new Error(`External service error: ${actualError.message || 'Service unavailable'}`);
        serviceError.status = actualError.status || actualError.response?.status || 502;
        serviceError.originalError = actualError;
        return { error: serviceError };
      }

      return { error: actualError };
    }

    const usersJointArr = _
      .chain(accounts)
      .reduce((acc, el) => _.concat(acc, el.wallet), [])
      .orderBy(['timestamp', '_id'], ['desc', 'desc'])
      .value();
    const limitedWallet = _.take(usersJointArr, limit);

    const { rates } = await getCurrencyRates({
      wallet: limitedWallet, pathTimestamp: 'timestamp', momentCallback: moment.unix,
    });

    await getExemptions({ user, wallet: limitedWallet });

    const { walletWithTokenPrice, error: dbError } = await addTokenPrice({
      wallet: limitedWallet, rates, currency, symbol,
    });
    if (dbError) return { error: dbError };
    const resultWallet = await addCurrencyToOperations({
      walletWithTokenPrice, rates, currency, symbol,
    });

    const resAccounts = _.reduce(accounts, (acc, el) => (accumulateAcc({
      resultArray: limitedWallet,
      account: el,
      acc,
    })), []);

    const depositWithdrawals = calcDepositWithdrawals({ operations: resultWallet, field: currency });

    const hasMore = resultWallet.length >= limit
      || _.some(accounts, (acc) => !!acc.hasMore);

    const result = {
      wallet: resultWallet,
      accounts: resAccounts,
      hasMore,
      ...depositWithdrawals,
    };

    return { result };
  } catch (err) {
    console.error(`[${requestId}] getWalletAdvancedReport: Unhandled error after ${Date.now() - startTime}ms:`, {
      message: err.message,
      stack: err.stack,
      name: err.name,
      params: {
        accounts: accounts?.length, startDate, endDate, limit, currency, symbol,
      },
    });
    return { error: err };
  }
};

const getWalletData = async ({
  userName, types, endDate, startDate, symbol, offset, limit,
}) => {
  const walletOperations = [];
  const { response, error } = await accountHistory({
    timestampEnd: moment(endDate).unix(),
    timestampStart: moment(startDate).unix(),
    symbol,
    account: userName,
    ops: types.toString(),
    limit,
    offset,
  });
  if (error) return { error };

  walletOperations.push(...response.data);

  return { wallet: walletOperations };
};

const cachedGetWalletData = cacheWrapperWithTTLRefresh(getWalletData);
const cachedGetSwapData = cacheWrapperWithTTLRefresh(EngineAccountHistory.find);

// Global rate limiter instance for Hive Engine API - configured via environment
// Increased from 30 to 45 requests per minute for better throughput
const hiveEngineRateLimiter = createConfigurableRateLimiter('HIVE_API', 45);

const addWalletDataToAccounts = async ({
  accounts, startDate, endDate, limit, filterAccounts, symbol, addSwaps,
}) => {
  // Rate limiting configuration - can be overridden by environment variables
  const rateLimitConfig = {
    baseDelay: parseInt(process.env.HIVE_API_BASE_DELAY) || 100, // Reduced from 150ms to 100ms
    maxDelay: parseInt(process.env.HIVE_API_MAX_DELAY) || 1000, // Reduced from 2000ms to 1000ms
    maxRetries: parseInt(process.env.HIVE_API_MAX_RETRIES) || 2, // Max retries for failed requests
  };

  // Calculate adaptive delay based on number of accounts (reduced multiplier)
  const delayMs = Math.min(
    rateLimitConfig.baseDelay + (accounts.length * 10), // Reduced from 15 to 10
    rateLimitConfig.maxDelay,
  );

  console.log(`Processing ${accounts.length} accounts sequentially with ${delayMs}ms delay between requests to prevent API overload`);

  // Process accounts sequentially with rate limiting using the refactored rate limiter
  const results = await processWithRateLimit(accounts, async (account) => {
    try {
    // cached requests with ttl ttl increase when requested with same key

      const walletKey = getCacheKey({
        name: account.name,
        startDate,
        endDate,
        symbol,
        limit,
        offset: account.offset || 0,
      });
      const swapKey = getCacheKey({
        name: account.name,
        startDate,
        endDate,
        symbol,
        limit,
        addSwaps,
        skip: account.offsetSwap || 0,
      });

      const types = addSwaps ? [...ADVANCED_WALLET_TYPES, ...Object.values(MARKET_OPERATIONS)] : ADVANCED_WALLET_TYPES;

      const walletData = cachedGetWalletData({
        types,
        userName: account.name,
        startDate,
        endDate,
        symbol,
        limit,
        offset: account.offset || 0,
      })({ key: `${REDIS_KEYS.ADVANCED_REPORT}:${walletKey}`, ttl: TTL_TIME.THIRTY_SECONDS });
      const swapData = cachedGetSwapData({
        condition: constructDbQuery({
          account: account.name,
          timestampEnd: moment(endDate).unix(),
          timestampStart: moment(startDate).unix(),
          symbol,
          addSwaps,
        }),
        sort: { timestamp: -1 },
        limit,
        skip: account.offsetSwap || 0,
      })({ key: `${REDIS_KEYS.ADVANCED_REPORT}:${swapKey}`, ttl: TTL_TIME.THIRTY_SECONDS });

      const responses = await Promise.all([walletData, swapData]);
      const errorResponse = responses.find((v) => v?.error);
      if (errorResponse) return { error: errorResponse.error };

      // Safely destructure responses with fallbacks
      const walletResponse = responses[0] || {};
      const swapResponse = responses[1] || {};
      const wallet = walletResponse.wallet || [];
      const result = swapResponse.result || [];

      // we filter mutual transaction withdrawDeposit return empty string on mutual
      account.wallet = [...wallet, ..._.map(result, (v) => ({ ...v, swDb: true }))]
        .reduce((acc, el) => {
          const wd = withdrawDeposit({
            type: el.operation, record: el, userName: account.name, filterAccounts, symbol,
          });
          if (!wd) return acc;
          return [...acc, { ...el, withdrawDeposit: wd }];
        }, []);
      account.hasMore = account.wallet.length >= limit;

      return account;
    } catch (err) {
      console.error('addWalletDataToAccounts: Error processing account:', account.name, {
        message: err.message,
        stack: err.stack,
      });
      return { error: err };
    }
  }, {
    delayMs,
    maxRetries: rateLimitConfig.maxRetries,
    // Removed global rate limiter - using only per-request delays for consistent timing
    onProgress: (current, total, account, retryCount) => {
      console.log(`Processing account ${current}/${total}: ${account.name}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
    },
  });

  // Process rate-limited results
  const processedAccounts = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      processedAccounts.push(result.value);
    } else {
      console.error('addWalletDataToAccounts: Promise rejected:', result.reason);
      processedAccounts.push({ error: result.reason });
    }
  }

  return processedAccounts;
};

const withdrawDeposit = ({
  type, record, filterAccounts, userName, symbol,
}) => {
  const isMutual = multiAccountFilter({ record, filterAccounts, userName });
  if (isMutual) return '';

  const result = {
    [WAIV_OPERATIONS_TYPES.TOKENS_TRANSFER]: _.get(record, 'to') === userName ? 'd' : 'w',
    [WAIV_OPERATIONS_TYPES.TOKENS_STAKE]: _.get(record, 'from') !== userName
      ? 'd' : _.get(record, 'to') === userName ? '' : 'w',
    [WAIV_OPERATIONS_TYPES.AUTHOR_REWARDS]: _.get(record, 'to') === userName ? 'd' : 'w',
    [WAIV_OPERATIONS_TYPES.BENEFICIARY_REWARD]: _.get(record, 'to') === userName ? 'd' : 'w',
    [WAIV_OPERATIONS_TYPES.CURATION_REWARDS]: _.get(record, 'to') === userName ? 'd' : 'w',
    [WAIV_OPERATIONS_TYPES.MINING_LOTTERY]: 'd',
    [WAIV_DB_OPERATIONS.SWAP]: record?.symbolOut === symbol ? 'd' : 'w',
    [MARKET_OPERATIONS.MARKET_SELL]: 'w',
    [MARKET_OPERATIONS.MARKET_BUY]: 'd',
    [AIRDROP]: 'd',
  };

  return result[type] || '';
};

const constructDbQuery = ({
  account,
  timestampEnd,
  timestampStart,
  symbol,
  addSwaps,
}) => {
  if (!addSwaps) {
    return {
      account,
      timestamp: { $lte: timestampEnd, $gte: timestampStart },
      operation: AIRDROP,
      symbol,
    };
  }

  return {
    account,
    timestamp: { $lte: timestampEnd, $gte: timestampStart },
    operation: { $in: [AIRDROP, WAIV_DB_OPERATIONS.SWAP] },
    $or: [
      { symbol },
      { symbolOut: symbol },
      { symbolIn: symbol },
    ],
  };
};

const multiAccountFilter = ({ record, filterAccounts, userName }) => {
  filterAccounts = _.filter(filterAccounts, (el) => el !== userName);

  if (record.operation === WAIV_OPERATIONS_TYPES.TOKENS_TRANSFER || record.operation === WAIV_OPERATIONS_TYPES.TOKENS_STAKE) {
    return record.to === record.from ? true
      : _.some(filterAccounts, (el) => _.includes([record.to, record.from], el));
  }

  return false;
};

const getCurrencyRates = async ({
  wallet, pathTimestamp, momentCallback,
}) => {
  let includeToday = false;
  const dates = _.uniq(_.map(wallet, (record) => {
    if (momentCallback(_.get(record, `${pathTimestamp}`)).isSame(Date.now(), 'day')) includeToday = true;
    return momentCallback(_.get(record, `${pathTimestamp}`)).format('YYYY-MM-DD');
  }));

  const { result = [] } = await CurrenciesRate.find(
    { dateString: { $in: dates }, base: SUPPORTED_CURRENCIES.USD },
  );

  if (includeToday) {
    const { result: latest } = await CurrenciesRate.findOne({
      condition: { base: SUPPORTED_CURRENCIES.USD },
      sort: { dateString: -1 },
    });
    if (latest) {
      latest.dateString = moment().format('YYYY-MM-DD');
      result.push(latest);
    }
  }

  return { rates: result };
};

const getExemptions = async ({ user, wallet }) => {
  let exemptions = [];
  if (user) {
    const condition = _.reduce(wallet, (acc, record) => {
      const filter = { userName: user, userWithExemptions: record.account, recordId: new ObjectId(record._id) };
      acc.push({ ...filter });
      return acc;
    }, []);

    ({ result: exemptions = [] } = await WalletExemptions.find({ $or: condition }));
  }
  for (const rec of wallet) {
    rec.checked = !!_.find(exemptions, (ex) => rec._id.toString() === ex.recordId.toString());
  }
};

const addTokenPrice = async ({
  wallet, rates, currency, symbol,
}) => {
  if (_.isEmpty(wallet)) return wallet;

  const { tokenPriceArr, error } = await getSymbolCurrencyHistory({ walletOperations: wallet, path: 'timestamp', symbol });
  if (error) return { error };

  return {
    walletWithTokenPrice: _.map(wallet, (record) => {
      const price = _.find(tokenPriceArr, (el) => moment(el.dateString).isSame(moment.unix(record.timestamp).format('YYYY-MM-DD')));
      record[`${symbol}.USD`] = _.get(price, 'rates.USD', '0');
      if (!_.isEmpty(rates) && currency !== SUPPORTED_CURRENCIES.USD) {
        const rate = _.find(rates, (el) => moment(el.dateString).isSame(moment.unix(record.timestamp).format('YYYY-MM-DD')));
        record[`${symbol}.${currency}`] = new BigNumber(record[`${symbol}.USD`]).times(_.get(rate, `rates.${currency}`)).toNumber();
      }

      return record;
    }),
  };
};

const getSymbolCurrencyHistory = async ({ walletOperations, path = 'timestamp', symbol }) => {
  let includeToday = false;
  const orCondition = _
    .chain(walletOperations)
    .map((el) => _.get(el, path, null))
    .uniq()
    .reduce((acc, el) => {
      if (moment.unix(el).isSame(Date.now(), 'day')) includeToday = true;
      acc.push({ dateString: moment.unix(el).format('YYYY-MM-DD') });

      return acc;
    }, [])
    .value();

  const { result = [], error } = await HiveEngineRate.find({
    condition: {
      type: STATISTIC_RECORD_TYPES.DAILY,
      base: symbol,
      $or: orCondition,
    },
    projection: { [`rates.${SUPPORTED_CURRENCIES.USD}`]: 1, dateString: 1 },
  });
  if (error) return { error };

  if (includeToday) {
    const object = await calculateTodaysRate(result, symbol);
    if (object instanceof Error) return object;

    if (object) result.push(object);
  }

  return { tokenPriceArr: result };
};

const calculateTodaysRate = async (result, symbol) => {
  const { result: rates, error } = await HiveEngineRate.find({
    condition: {
      type: STATISTIC_RECORD_TYPES.ORDINARY,
      base: symbol,
      dateString: moment().format('YYYY-MM-DD'),
    },
    projection: { [`rates.${SUPPORTED_CURRENCIES.USD}`]: 1, dateString: 1 },
  });
  if (error) return error;

  if (rates.length) {
    const rateSum = _.reduce(rates, (acc, curr) => (acc).plus(curr.rates.USD), new BigNumber(0));

    return {
      dateString: rates[0].dateString,
      rates: { USD: Number((rateSum).dividedBy(rates.length).toFixed(USD_PRECISION, BigNumber.ROUND_UP)) },
    };
  }
};

const addCurrencyToOperations = async ({
  walletWithTokenPrice, currency, rates, symbol,
}) => _.map(walletWithTokenPrice, (record) => {
  const USD = getPriceInUSD(record, symbol);
  record[currency] = calcWalletRecordRate({
    USD, rates, timestamp: record.timestamp, currency,
  });

  return record;
});

const getPriceInUSD = (record, symbol) => {
  if (!record.quantity && !record.symbolInQuantity && !record.quantityTokens) return 0;

  if (!record.quantity && record.symbolInQuantity) {
    record.quantity = record.symbolIn === symbol ? record.symbolInQuantity : record.symbolOutQuantity;
  } else if (!record.quantity && record.quantityTokens) record.quantity = record.quantityTokens;
  record.quantity = Number(record.quantity);

  return new BigNumber(record.quantity).times(record[`${symbol}.USD`]).toNumber();
};

const calcWalletRecordRate = ({
  USD, timestamp, rates, currency,
}) => {
  if (currency === SUPPORTED_CURRENCIES.USD) return USD;

  const dayRateRecord = _.find(rates, (el) => moment.unix(timestamp).isSame(moment(el.dateString), 'day'));
  const rate = _.get(dayRateRecord, `rates.${currency}`, 0);

  return new BigNumber(USD).times(rate).toNumber();
};

const accumulateAcc = ({ resultArray, account, acc }) => {
  const filterWallet = _.filter(
    account.wallet,
    (record) => !_.some(resultArray, (result) => _.isEqual(result, record)),
  );

  // total records in result array by account
  if (_.isEmpty(filterWallet) && account.hasMore === false) return acc;
  const offset = _.filter(
    resultArray,
    (el) => el.account === account.name && !el.swDb,
  ).length;
  const offsetSwap = _.filter(
    resultArray,
    (el) => el.account === account.name && el.swDb,
  ).length;

  account.offset = account.offset ? account.offset + offset : offset;
  account.offsetSwap = account.offsetSwap ? account.offsetSwap + offsetSwap : offsetSwap;

  acc.push(_.omit(account, ['wallet', 'hasMore']));

  return acc;
};

const calcDepositWithdrawals = ({ operations, field }) => _
  .reduce(operations, (acc, el) => {
    if (_.get(el, 'checked')) return acc;

    switch (_.get(el, 'withdrawDeposit')) {
      case 'w':
        acc.withdrawals = add(acc.withdrawals, el[field]);
        break;
      case 'd':
        acc.deposits = add(acc.deposits, el[field]);
        break;
    }
    return acc;
  }, { deposits: 0, withdrawals: 0 });
