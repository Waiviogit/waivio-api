/* eslint-disable camelcase */
const {
  User, withdrawFundsModel, paymentHistory,
} = require('models');
const axios = require('axios');
const { ERROR_OBJ } = require('constants/common');
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const { captureException } = require('utilities/helpers/sentryHelper');
const { transfer } = require('../../hiveApi/broadcastUtil');
const redisGetter = require('../../redis/redisGetter');
const { CACHE_KEY } = require('../../../constants/common');
const { getGuestBalanceHistory } = require('./guestHiveWallet');
const { PAYMENT_HISTORIES_TYPES } = require('../../../constants/campaignsData');

const HIVE_BANK_ACCOUNT = process.env.WALLET_ACC_NAME;
const API_KEY = process.env.SIMPLESWAP_API_KEY;

const SWAP_ENDPOINT = {
  HOST: 'https://api.simpleswap.io',
  CREATE_EXCHANGE: '/create_exchange',
  GET_ESTIMATED: '/get_estimated',
  GET_RANGES: '/get_ranges',
};

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

const withdrawFromHive = async ({
  userName, address, outputCoinType, amount,
}) => {
  if (process.env.NODE_ENV !== 'production') return { error: { status: 403, message: 'Forbidden' } };
  const { user } = await User.getOne(userName, '+auth');
  if (!user && !user.auth) return { error: ERROR_OBJ.NOT_FOUND };

  const { result, error: balanceError } = await validateWithdrawAmount({ amount, userName });
  if (balanceError) return { error: balanceError };
  // validate funds amount
  const { result: exchange, error: createExchangeError } = await createExchange({
    address, amount, outputCoinType,
  });
  if (createExchangeError) {
    return { error: ERROR_OBJ.UNPROCESSABLE };
  }

  const {
    extra_id_from: memo, address_from: receiver, id: exchangeId, amount_to: outputAmount,
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
  if (createWithdrawErr) return { error: createWithdrawErr };

  const { result: transaction, error: transactionError } = await transfer({
    amount,
    from: process.env.WALLET_ACC_NAME,
    activeKey: process.env.WALLET_ACC_KEY,
    to: receiver,
    memo,
  });

  if (transactionError) {
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
    memo: `Withdrawal transaction ID for the HIVE-${outputCoinType} pair via SimpleSwap.io: https://simpleswap.io/exchange?id=${exchangeId}`,
    withdraw: withdraw._id,
  });

  return { result: exchangeId };
};

const withdrawEstimates = async ({ outputCoinType, amount }) => {
  try {
    const url = `${SWAP_ENDPOINT.HOST}${SWAP_ENDPOINT.GET_ESTIMATED}`;
    const result = await axios.get(
      url,
      {
        params: {
          api_key: API_KEY,
          fixed: false,
          currency_from: 'hive',
          currency_to: outputCoinType,
          amount,
        },
      },
    );

    return {
      result: result?.data,
    };
  } catch (error) {
    return { error };
  }
};

const withdrawRange = async ({ outputCoinType }) => {
  try {
    const url = `${SWAP_ENDPOINT.HOST}${SWAP_ENDPOINT.GET_RANGES}`;
    const result = await axios.get(
      url,
      {
        params: {
          api_key: API_KEY,
          fixed: false,
          currency_from: 'hive',
          currency_to: outputCoinType,
        },
      },
    );

    return {
      result: result?.data,
    };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  withdrawFromHive,
  withdrawEstimates,
  withdrawRange,
};
