/* eslint-disable camelcase */
const axios = require('axios');
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const { ERROR_OBJ } = require('../../../constants/common');
const {
  User, withdrawFundsModel, paymentHistory,
} = require('../../../models');
const { captureException } = require('../../helpers/sentryHelper');
const { transfer } = require('../../hiveApi/broadcastUtil');
const { CACHE_KEY } = require('../../../constants/common');
const { getGuestBalanceHistory } = require('./guestHiveWallet');
const { PAYMENT_HISTORIES_TYPES } = require('../../../constants/campaignsData');
const changellyAPI = require('../changellyAPI');
const { redisGetter, redis, redisSetter } = require('../../redis');

const HIVE_BANK_ACCOUNT = process.env.WALLET_ACC_NAME;
const API_KEY = process.env.SIMPLESWAP_API_KEY;

const SWAP_ENDPOINT = {
  HOST: 'https://api.simpleswap.io',
  CREATE_EXCHANGE: '/create_exchange',
  GET_ESTIMATED: '/get_estimated',
  GET_RANGES: '/get_ranges',
};

// memo: string, receiver: string, exchangeId: string, outputAmount
const createExchange = async ({
  address, outputCoinType, amount,
}) => {
  try {
    const body = {
      fixed: false,
      currency_from: 'hive',
      currency_to: outputCoinType,
      amount,
      address_to: address,
      extra_id_to: '',
      user_refund_address: HIVE_BANK_ACCOUNT,
      user_refund_extra_id: '',
    };

    const result = await axios.post(
      `${SWAP_ENDPOINT.HOST}${SWAP_ENDPOINT.CREATE_EXCHANGE}?api_key=${API_KEY}`,
      body,
    );

    return { result: result.data };
  } catch (error) {
    return { error };
  }
};
const getUsdValue = async ({ amountHive }) => {
  const { result: median } = await redisGetter.getHashAll({
    key: CACHE_KEY.CURRENT_MEDIAN_HISTORY_PRICE,
  });
  const rate = new BigNumber(parseFloat(_.get(median, 'base', '0')))
    .div(parseFloat(_.get(median, 'quote', '0')));

  return new BigNumber(amountHive).times(rate).toNumber();
};

const validateWithdrawAmount = async ({ amount, userName }) => {
  const { payable } = await getGuestBalanceHistory({ userName, limit: 1, skip: 0 });
  if (!_.isNumber(payable)) return { error: ERROR_OBJ.FORBIDDEN };
  if (payable < amount) {
    return { error: ERROR_OBJ.FORBIDDEN };
  }
  return { result: true };
};

const WITHDRAW_LOCK_KEY_HIVE = 'guest_withdraw_lock_hive:';

const getWithdrawLock = async (account) => {
  const { result } = await redisGetter.getAsync({
    key: `${WITHDRAW_LOCK_KEY_HIVE}${account}`,
    client: redis.processedPostClient,
  });

  return result;
};
const setLock = async (account) => {
  await redisSetter.setEx({
    key: `${WITHDRAW_LOCK_KEY_HIVE}${account}`,
    client: redis.processedPostClient,
    value: account,
    ttl: 60 * 60 * 24,
  });
};
const delWithdrawLock = async (account) => {
  await redisSetter.deleteKey({
    key: `${WITHDRAW_LOCK_KEY_HIVE}${account}`,
    client: redis.processedPostClient,
  });
};

const withdrawFromHive = async ({
  userName, address, outputCoinType, amount,
}) => {
  if (process.env.NODE_ENV !== 'production') return { error: { status: 403, message: 'Forbidden' } };
  const lock = await getWithdrawLock(userName);
  if (lock) return { error: { status: 403, message: 'Forbidden' } };
  await setLock(userName);

  const { user } = await User.getOne(userName, '+auth');
  if (!user && !user.auth) {
    await delWithdrawLock(userName);
    return { error: ERROR_OBJ.NOT_FOUND };
  }

  const { result, error: balanceError } = await validateWithdrawAmount({ amount, userName });
  if (balanceError) {
    await delWithdrawLock(userName);
    return { error: balanceError };
  }
  // validate funds amount
  const { result: exchange, error: createExchangeError } = await changellyAPI
    .createExchangeWrapper({
      address, amount, outputCoinType, refundAddress: HIVE_BANK_ACCOUNT,
    });

  if (createExchangeError) {
    await delWithdrawLock(userName);
    return { error: ERROR_OBJ.UNPROCESSABLE };
  }

  const {
    memo, receiver, exchangeId, outputAmount,
  } = exchange;

  const usdValue = await getUsdValue({ amountHive: amount });

  const { withdraw, error: createWithdrawErr } = await withdrawFundsModel.create({
    memo,
    receiver,
    auth: user.auth,
    account: userName,
    exchangeId,
    inputCoinType: 'hive',
    outputCoinType,
    amount,
    outputAmount,
    address,
    usdValue,
  });
  if (createWithdrawErr) {
    await delWithdrawLock(userName);
    return { error: createWithdrawErr };
  }

  const { result: transaction, error: transactionError } = await transfer({
    amount,
    from: process.env.WALLET_ACC_NAME,
    activeKey: process.env.WALLET_ACC_KEY,
    to: receiver,
    memo,
  });

  if (transactionError) {
    await delWithdrawLock(userName);
    await captureException(transactionError);
    return { error: transactionError };
  }

  await withdrawFundsModel.updateOne(
    { _id: withdraw._id },
    { status: 'success', transactionId: transaction?.id },
  );

  await paymentHistory.addPaymentHistory({
    userName: withdraw.account,
    type: PAYMENT_HISTORIES_TYPES.DEMO_USER_TRANSFER,
    amount: withdraw.amount,
    sponsor: withdraw.receiver,
    memo: withdraw.memo,
    withdraw: withdraw._id,
  });

  await paymentHistory.addPaymentHistory({
    userName,
    type: PAYMENT_HISTORIES_TYPES.DEMO_USER_TRANSFER,
    amount: 0,
    sponsor: userName,
    memo: `Withdrawal transaction ID for the HIVE-${outputCoinType} pair via Changelly.com: https://changelly.com/track/${exchangeId}`,
    withdraw: withdraw._id,
  });
  await delWithdrawLock(userName);

  return { result: exchangeId };
};

// result : string
const withdrawEstimates = async ({ outputCoinType, amount }) => {
  const { result, error } = await changellyAPI.getExchangeAmount({
    to: outputCoinType,
    amountFrom: amount,
  });
  if (error) return { error };

  return { result: result.amountTo };

  // try {
  //   const url = `${SWAP_ENDPOINT.HOST}${SWAP_ENDPOINT.GET_ESTIMATED}`;
  //   const result = await axios.get(
  //     url,
  //     {
  //       params: {
  //         api_key: API_KEY,
  //         fixed: false,
  //         currency_from: 'hive',
  //         currency_to: outputCoinType,
  //         amount,
  //       },
  //     },
  //   );
  //
  //   return {
  //     result: result?.data,
  //   };
  // } catch (error) {
  //   return { error };
  // }
};

// {min: string, max: string}
const withdrawRange = async ({ outputCoinType }) => {
  const { result, error } = await changellyAPI.getPairParams({
    to: outputCoinType,
  });
  if (error) return { error };

  const { result: amount } = await changellyAPI.getExchangeAmount({
    to: outputCoinType,
    amountFrom: parseFloat(result.minAmountFixed),
  });

  return {
    result: {
      min: result.minAmountFloat,
      max: result.maxAmountFloat,
      rate: amount?.rate,
    },
  };

  // try {
  //   const url = `${SWAP_ENDPOINT.HOST}${SWAP_ENDPOINT.GET_RANGES}`;
  //   const result = await axios.get(
  //     url,
  //     {
  //       params: {
  //         api_key: API_KEY,
  //         fixed: false,
  //         currency_from: 'hive',
  //         currency_to: outputCoinType,
  //       },
  //     },
  //   );
  //
  //   return {
  //     result: result?.data,
  //   };
  // } catch (error) {
  //   return { error };
  // }
};

module.exports = {
  withdrawFromHive,
  withdrawEstimates,
  withdrawRange,
};
