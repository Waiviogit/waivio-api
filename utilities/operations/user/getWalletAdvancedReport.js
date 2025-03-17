const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');
const moment = require('moment');
const BigNumber = require('bignumber.js');
const {
  EngineAccountHistory, CurrenciesRate, WalletExemptions, HiveEngineRate,
} = require('../../../models');
const {
  SUPPORTED_CURRENCIES,
  TTL_TIME,
} = require('../../../constants/common');
const { ADVANCED_WALLET_TYPES, WAIV_OPERATIONS_TYPES, AIRDROP } = require('../../../constants/walletData');
const { accountHistory } = require('../../hiveEngine/accountHistory');
const { STATISTIC_RECORD_TYPES, USD_PRECISION } = require('../../../constants/currencyData');
const { add } = require('../../helpers/calcHelper');
const { getCachedData, getCacheKey, setCachedData } = require('../../helpers/cacheHelper');
const jsonHelper = require('../../helpers/jsonHelper');

exports.getWalletAdvancedReport = async ({
  accounts, startDate, endDate, limit, filterAccounts, user, currency, symbol,
}) => {
  // const key = getCacheKey({
  //   accounts, startDate, endDate, limit, filterAccounts, user, currency, symbol,
  // });

  // const cache = await getCachedData(key);
  // if (cache) return jsonHelper.parseJson(cache, {});

  accounts = await addWalletDataToAccounts({
    filterAccounts, startDate, accounts, endDate, limit, symbol,
  });

  const error = _.find(accounts, (account) => account.error);
  if (error) return { error };

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
  if (error) return { error: dbError };

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

  //  await setCachedData({ key, data: { result }, ttl: TTL_TIME.SEVEN_DAYS });

  return { result };
};

const addWalletDataToAccounts = async ({
  accounts, startDate, endDate, limit, filterAccounts, symbol,
}) => Promise.all(accounts.map(async (account) => {
  const { wallet, error } = await getWalletData({
    types: ADVANCED_WALLET_TYPES,
    userName: account.name,
    startDate,
    endDate,
    symbol,
    limit,
    offset: account.offset || 0,
  });
  if (error) return { error };

  const { result, error: dbError } = await EngineAccountHistory.find({
    condition: constructDbQuery({
      account: account.name,
      timestampEnd: moment(endDate).unix(),
      timestampStart: moment(startDate).unix(),
      symbol,
    }),
    sort: { timestamp: -1 },
  });
  if (dbError) return { error: dbError };

  account.wallet = wallet;
  if (account.wallet.length < limit) {
    account.wallet.push(...result);
  }
  account.hasMore = account.wallet.length >= limit;

  _.forEach(account.wallet, (el) => {
    el.withdrawDeposit = withdrawDeposit({
      type: el.operation, record: el, userName: account.name, filterAccounts,
    });
  });
  account.wallet = account.wallet.filter((el) => el.withdrawDeposit);

  return account;
}));

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

const withdrawDeposit = ({
  type, record, filterAccounts, userName,
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
    [AIRDROP]: 'd',
  };

  return result[type] || '';
};

const constructDbQuery = (params) => ({
  account: params.account,
  timestamp: { $lte: params.timestampEnd, $gte: params.timestampStart },
  operation: AIRDROP,
});

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

  const accountRecords = _.filter(resultArray, (el) => el.account === account.name);

  const offset = accountRecords.length;

  account.offset = account.offset ? account.offset + offset : offset;

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
