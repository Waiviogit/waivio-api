const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');
const moment = require('moment');
const {
  EngineAccountHistory, CurrenciesRate, WalletExemptions, HiveEngineRate,
} = require('models');
const BigNumber = require('bignumber.js');
const { SUPPORTED_CURRENCIES } = require('../../../constants/common');
const { ADVANCED_WALLET_TYPES, WAIV_OPERATIONS_TYPES, SWAP_TOKENS } = require('../../../constants/walletData');
const { accountHistory } = require('../../hiveEngine/accountHistory');
const { STATISTIC_RECORD_TYPES, USD_PRECISION } = require('../../../constants/currencyData');
const { add } = require('../../helpers/calcHelper');

exports.getWalletAdvancedReport = async ({
  accounts, startDate, endDate, limit, filterAccounts, user, currency, symbol,
}) => {
  accounts = await addWalletDataToAccounts({
    filterAccounts, startDate, accounts, endDate, limit, symbol,
  });
  if (accounts[0] instanceof Error) return { error: accounts[0] };

  const usersJointArr = _
    .chain(accounts)
    .reduce((acc, el) => _.concat(acc, el.wallet), [])
    .orderBy(['timestamp', '_id'], ['desc', 'desc'])
    .value();
  const limitedWallet = _.take(usersJointArr, limit);

  const { rates } = await getCurrencyRates({
    wallet: limitedWallet, currency, pathTimestamp: 'timestamp', momentCallback: moment.unix,
  });

  await getExemptions({ user, wallet: limitedWallet });

  const walletWithTokenPrice = await addTokenPrice({
    wallet: limitedWallet, rates, currency, symbol,
  });
  if (walletWithTokenPrice instanceof Error) return { error: walletWithTokenPrice };

  const resultWallet = await addCurrencyToOperations({
    walletWithTokenPrice, rates, currency, symbol,
  });

  const resAccounts = _.reduce(accounts, (acc, el) => (accumulateAcc({
    resultArray: limitedWallet,
    account: el,
    acc,
  })), []);

  const depositWithdrawals = calcDepositWithdrawals({ operations: resultWallet, field: currency });
  const hasMore = usersJointArr.length > resultWallet.length
        || _.some(accounts, (acc) => !!acc.hasMore);

  return {
    result: {
      wallet: resultWallet,
      accounts: resAccounts,
      hasMore,
      ...depositWithdrawals,
    },
  };
};

const addWalletDataToAccounts = async ({
  accounts, startDate, endDate, limit, filterAccounts, symbol,
}) => Promise.all(accounts.map(async (account) => {
  const wallet = await getWalletData({
    types: ADVANCED_WALLET_TYPES,
    userName: account.name,
    limit: limit + 1,
    startDate,
    endDate,
    symbol,
  });
  if (wallet instanceof Error) return account.wallet;

  const { result, error } = await EngineAccountHistory.find({
    condition: constructDbQuery({
      account: account.name,
      timestampEnd: moment.utc(endDate).valueOf(),
      timestampStart: moment.utc(startDate).valueOf(),
      symbol,
    }),
    limit: limit + 1,
    sort: { timestamp: -1 },
  });
  if (error) return error;

  account.wallet = _.orderBy([...wallet, ...result], ['timestamp', '_id'], ['desc', 'desc']);
  if (account.lastId) {
    const updateSkip = account.wallet.indexOf(_.find(account.wallet,
      (obj) => obj._id.toString() === account.lastId)) + 1;
    account.wallet = account.wallet.slice(updateSkip, updateSkip + limit);
  }

  _.forEach(account.wallet, (el) => {
    el.withdrawDeposit = withdrawDeposit({
      type: el.operation, record: el, userName: account.name, filterAccounts, symbol,
    });
  });
  account.hasMore = account.wallet.length > limit;

  return account;
}));

const getWalletData = async ({
  userName, limit, types, endDate, startDate, symbol,
}) => {
  let records = [];
  const batchSize = 500;
  const walletOperations = [];
  const startDateTimestamp = moment.utc(startDate).valueOf();
  const endDateTimestamp = moment.utc(endDate).valueOf();
  const response = await accountHistory({
    timestampEnd: endDateTimestamp,
    timestampStart: startDateTimestamp,
    symbol,
    account: userName,
    ops: types.toString(),
    limit: limit > batchSize ? batchSize : limit,
  });
  if (response instanceof Error) return response;

  records = response.data;
  for (const record of records) {
    const recordTimestamp = moment.utc(_.get(record, 'timestamp')).valueOf();
    const condition = startDateTimestamp >= recordTimestamp || walletOperations.length === limit;
    if (condition) break;

    if (endDateTimestamp < recordTimestamp) continue;

    walletOperations.push(record);
  }

  return walletOperations;
};

const withdrawDeposit = ({
  type, record, filterAccounts, userName, symbol,
}) => {
  const isMutual = multiAccountFilter({ record, filterAccounts, userName });
  if (isMutual) return '';

  const result = {
    [WAIV_OPERATIONS_TYPES.MARKET_BUY]: 'd',
    [WAIV_OPERATIONS_TYPES.MARKET_SELL]: 'w',
    [WAIV_OPERATIONS_TYPES.TOKENS_TRANSFER]: _.get(record, 'to') === userName ? 'd' : 'w',
    [WAIV_OPERATIONS_TYPES.TOKENS_STAKE]: _.get(record, 'from') === userName ? '' : 'd',
    [WAIV_OPERATIONS_TYPES.AUTHOR_REWARDS]: _.get(record, 'to') === userName ? 'd' : 'w',
    [WAIV_OPERATIONS_TYPES.BENEFICIARY_REWARD]: _.get(record, 'to') === userName ? 'd' : 'w',
    [WAIV_OPERATIONS_TYPES.CURATION_REWARDS]: _.get(record, 'to') === userName ? 'd' : 'w',
    [SWAP_TOKENS]: _.get(record, 'symbolIn') === symbol ? 'w' : '',
    [WAIV_OPERATIONS_TYPES.MINING_LOTTERY]: 'd',
    [WAIV_OPERATIONS_TYPES.AIRDROP]: 'd',
  };

  return result[type] || '';
};

const constructDbQuery = (params) => ({
  account: params.account,
  timestamp: { $lte: params.timestampEnd, $gte: params.timestampStart },
  operation: SWAP_TOKENS,
  $or: [{ symbolIn: params.symbol }, { symbolOut: params.symbol }],
});

const multiAccountFilter = ({ record, filterAccounts, userName }) => {
  filterAccounts = _.filter(filterAccounts, (el) => el !== userName);

  if (record.type === WAIV_OPERATIONS_TYPES.TOKENS_TRANSFER || record.type === WAIV_OPERATIONS_TYPES.TOKENS_STAKE) {
    return record.to === record.from ? true
      : _.some(filterAccounts, (el) => _.includes([record.to, record.from], el));
  }

  return false;
};

const getCurrencyRates = async ({
  wallet, currency, pathTimestamp, momentCallback,
}) => {
  let includeToday = false;
  const dates = _.uniq(_.map(wallet, (record) => {
    if (momentCallback(_.get(record, `${pathTimestamp}`)).isSame(Date.now(), 'day')) includeToday = true;
    return momentCallback(_.get(record, `${pathTimestamp}`)).format('YYYY-MM-DD');
  }));

  const { result = [] } = await CurrenciesRate.find(
    { dateString: { $in: dates }, base: SUPPORTED_CURRENCIES.USD },
    { [`rates.${currency}`]: 1, dateString: 1 },
  );

  if (includeToday) {
    const { result: latest } = await CurrenciesRate.findOne({
      condition: { base: SUPPORTED_CURRENCIES.USD },
      select: { [`rates.${currency}`]: 1 },
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
      const filter = { userName: user, userWithExemptions: record.account, _id: ObjectId(record._id) };
      acc.push({ ...filter });
      return acc;
    }, []);

    ({ result: exemptions = [] } = await WalletExemptions.find({ $or: condition }));
  }
  for (const exemption of exemptions) {
    const record = _.find(wallet, (rec) => rec._id.toString() === exemption._id.toString());
    if (record) {
      record.checked = true;
    }
  }
};

const addTokenPrice = async ({
  wallet, rates, currency, symbol,
}) => {
  if (_.isEmpty(wallet)) return wallet;

  const tokenPriceArr = await getSymbolCurrencyHistory({ walletOperations: wallet, path: 'timestamp', symbol });
  if (tokenPriceArr instanceof Error) return tokenPriceArr;

  return _.map(wallet, (record) => {
    const price = _.find(tokenPriceArr, (el) => moment(el.dateString).isSame(moment.unix(record.timestamp).format('YYYY-MM-DD')));
    record[`${symbol}.USD`] = _.get(price, 'rates.USD', '0');
    if (!_.isEmpty(rates) && currency !== SUPPORTED_CURRENCIES.USD) {
      const rate = _.find(rates, (el) => moment(el.dateString).isSame(moment.unix(record.timestamp).format('YYYY-MM-DD')));
      record[`${symbol}.${currency}`] = new BigNumber(record[`${symbol}.USD`]).times(_.get(rate, `rates.${currency}`)).toNumber();
    }

    return record;
  });
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
  if (error) return error;

  if (includeToday) {
    const object = await calculateTodaysRate(result, symbol);
    if (object instanceof Error) return object;

    result.push(object);
  }

  return result;
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
  if (!record.quantity && !record.symbolInQuantity) return 0;

  let quantity;
  if (record.quantity) {
    quantity = record.quantity;
  } else if (record.symbolInQuantity) {
    quantity = record.symbolIn === symbol ? record.symbolInQuantity : record.symbolOutQuantity;
  }

  return new BigNumber(quantity).times(record[`${symbol}.USD`]).toNumber();
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
  const lastId = _.get(_.last(account.wallet), 'lastId', '');
  const filterWallet = _.filter(account.wallet,
    (record) => !_.some(resultArray, (result) => _.isEqual(result, record)));
  if (_.isEmpty(filterWallet) && account.hasMore === false) return acc;

  account.lastId = _.isEmpty(filterWallet)
    ? lastId
    : _.get(filterWallet, '[0]._id');
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
