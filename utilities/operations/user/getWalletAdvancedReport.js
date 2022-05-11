const _ = require('lodash');
const moment = require('moment');
const { ADVANCED_WALLET_TYPES, SAVINGS_TRANSFERS } = require('../../../constants/walletData');
const { accountHistory } = require('../../hiveEngine/accountHistory');

exports.getWalletAdvancedReport = async ({
  accounts, startDate, endDate, limit, filterAccounts, user, currency,
}) => {
  // как-то сделать отфутболивание от аккаунта гость
  // наверное они мне не нужны
  // const dynamicProperties = await redisGetter.getHashAll('dynamic_global_properties');
  // console.log('dynamicProperties', dynamicProperties);
  accounts = await addWalletDataToAccounts({
    filterAccounts, startDate, accounts, endDate, limit,
  });
  console.log('accounts', accounts);
  // const usersJointArr = _
  //   .chain(accounts)
  //   .reduce((acc, el) => _.concat(acc, el.wallet), [])
  //   .orderBy(['timestamp'], ['desc'])
  //   .value();
  //
  // const limitedWallet = _.take(usersJointArr, limit);
  // const { rates } = await getCurrencyRates({
  //   wallet: limitedWallet, currency, pathTimestamp: 'timestamp', momentCallback: moment.unix,
  // });
  //
  // await getExemptions({ user, wallet: limitedWallet });
  //
  // const walletWithHivePrice = await addHivePrice({ wallet: limitedWallet, rates, currency });
  // const resultWallet = await addCurrencyToOperations({
  //   walletWithHivePrice, dynamicProperties, rates, currency,
  // });
  //
  // const resAccounts = _.reduce(accounts,
  //   (acc, el) => (!el.guest
  //     ? accumulateHiveAcc(limitedWallet, el, acc)
  //     : accumulateGuestAcc(limitedWallet, el, acc)), []);
  //
  // const depositWithdrawals = calcDepositWithdrawals({ operations: resultWallet, field: currency });
  //
  // const hasMore = usersJointArr.length > resultWallet.length
  //       || _.some(accounts, (acc) => !!acc.hasMore);
  //
  // return {
  //   wallet: resultWallet,
  //   accounts: resAccounts,
  //   hasMore,
  //   ...depositWithdrawals,
  // };
};

const addWalletDataToAccounts = async ({
  accounts, startDate, endDate, limit, filterAccounts,
}) => Promise.all(accounts.map(async (account) => {
  // if (account.guest) {
  //   const { histories, hasMore } = await getDemoDebtHistory({
  //     userName: account.name,
  //     skip: account.skip,
  //     tableView: true,
  //     startDate,
  //     endDate,
  //     limit,
  //   });
  //
  //   _.forEach(histories, (el) => {
  //     el.withdrawDeposit = withdrawDeposit({
  //       type: el.type, record: el, userName: account.name, filterAccounts,
  //     });
  //     el.timestamp = moment(el.createdAt).unix();
  //     el.guest = true;
  //   });
  //
  //   account.wallet = histories;
  //   account.hasMore = hasMore;
  //   return account;
  // }
  account.wallet = await getWalletData({
    operationNum: account.operationNum,
    types: ADVANCED_WALLET_TYPES,
    userName: account.name,
    limit: limit + 1,
    tableView: true,
    startDate,
    endDate,
  });
  _.forEach(account.wallet, (el) => {
    el.withdrawDeposit = withdrawDeposit({
      type: el.type, record: el, userName: account.name, filterAccounts,
    });
  });
  account.hasMore = account.wallet.length > limit;
  return account;
}));

const getWalletData = async ({
  userName, limit, operationNum, types, endDate, startDate, tableView,
}) => {
  console.log('userName', userName);
  console.log('startDate', startDate);
  console.log('endDate', endDate);
  console.log('types', types);
  let result;
  const batchSize = 1000;
  let lastId = operationNum || -1;
  const walletOperations = [];
  const startDateTimestamp = moment.utc(startDate).valueOf();
  const endDateTimestamp = moment.utc(endDate).valueOf();
  do {
    const response = await accountHistory({
      timestampEnd: endDateTimestamp,
      timestampStart: startDateTimestamp,
      symbol: 'WAIV',
      account: userName,
      ops: types.toString(),
      limit,
    });
    let breakFlag = false;
    if (response instanceof Error) return [];

    if (!_.isArray(response.data) || !response.data.length) continue;

    result = response.data;
    console.log('result', result);
    lastId = _.get(result, '[0][0]');
    result = _.reverse(result);
    console.log('result aster reverse', result);
    for (const record of result) {
      // if (_.includes(types, _.get(record, '[1].op[0]'))) {
      const recordTimestamp = moment.utc(_.get(record, 'timestamp')).valueOf();
      const condition = tableView
        ? startDateTimestamp >= recordTimestamp || walletOperations.length === limit
        : walletOperations.length === limit;
      if (condition) {
        breakFlag = true;
        break;
      }

      if (tableView && endDateTimestamp < recordTimestamp) continue;

      walletOperations.push(record);
    }
    if (lastId === 1 || lastId === 0) breakFlag = true;
    if (breakFlag) break;
  } while (walletOperations.length <= limit || batchSize === result.length - 1);
  console.log('walletOperations', walletOperations);
  return formatWaivHistory({ walletOperations, tableView, userName });
};

const formatWaivHistory = ({ walletOperations, tableView, userName }) => (
  _.map(walletOperations, (history) => {
    const omitFromOperation = [
      'op', 'block', 'op_in_trx', 'trx_in_block', 'virtual_op', 'trx_id', 'deposited', 'from_account', 'to_account',
    ];
    const operation = {
      userName,
      type: history[1].op[0],
      timestamp: moment(history[1].timestamp).unix(),
      operationNum: history[0],
      ...history[1].op[1],
    };
    // if (_.includes(WITHDRAW_FORMAT_TYPES, operation.type)) {
    //   Object.assign(operation,
    //     {
    //       from: operation.from_account,
    //       to: operation.to_account,
    //       ...(
    //         operation.type === HIVE_OPERATIONS_TYPES.FILL_VESTING_WITHDRAW
    //               && { amount: operation.deposited }
    //       ),
    //     });
    // }
    if (tableView && _.includes(SAVINGS_TRANSFERS, operation.type)) omitFromOperation.push('amount');

    return _.omit(operation, omitFromOperation);
  }));
