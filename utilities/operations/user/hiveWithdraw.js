/* eslint-disable camelcase */
const axios = require('axios');
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const { ERROR_OBJ } = require('../../../constants/common');
const { User, withdrawFundsModel } = require('../../../models');
const { getAccount } = require('../../hiveApi/userUtil');
const redisGetter = require('../../redis/redisGetter');
const { CACHE_KEY } = require('../../../constants/common');

const API_KEY = process.env.SIMPLESWAP_API_KEY;

const SWAP_ENDPOINT = {
  HOST: 'https://api.simpleswap.io',
  CREATE_EXCHANGE: '/create_exchange',
  GET_ESTIMATED: '/get_estimated',
  GET_RANGES: '/get_ranges',
};

const getUsdValue = async ({ amountHive }) => {
  const { result: median } = await redisGetter.getHashAll({
    key: CACHE_KEY.CURRENT_MEDIAN_HISTORY_PRICE,
  });
  const rate = new BigNumber(parseFloat(_.get(median, 'base', '0')))
    .div(parseFloat(_.get(median, 'quote', '0')));

  return new BigNumber(amountHive).times(rate).toNumber();
};

const createExchange = async ({
  address, outputCoinType, amount, userName,
}) => {
  try {
    const body = {
      fixed: false,
      currency_from: 'hive',
      currency_to: outputCoinType,
      amount,
      address_to: address,
      extra_id_to: '',
      user_refund_address: userName,
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

const validateWithdrawAmount = async ({ amount, userName }) => {
  const { userData, error } = await getAccount(userName);
  if (error) return { error };
  const balance = parseFloat(userData.balance);

  if (!_.isNumber(balance)) return { error: ERROR_OBJ.FORBIDDEN };
  if (balance < amount) {
    return { error: ERROR_OBJ.FORBIDDEN };
  }
  return { result: true };
};

const withdrawFromHive = async ({
  userName, address, outputCoinType, amount,
}) => {
  const { user } = await User.getOne(userName);
  if (!user && !user.auth) return { error: ERROR_OBJ.NOT_FOUND };

  const { result, error: balanceError } = await validateWithdrawAmount({ amount, userName });
  if (balanceError) return { error: balanceError };

  const { result: exchange, error: createExchangeError } = await createExchange({
    address, amount, outputCoinType, userName,
  });

  if (createExchangeError) return { error: ERROR_OBJ.UNPROCESSABLE };

  const {
    extra_id_from: memo, address_from: receiver, id: exchangeId, amount_to: outputAmount,
  } = exchange;

  const usdValue = await getUsdValue({ amountHive: amount });

  const { withdraw, error: createWithdrawErr } = await withdrawFundsModel.create({
    memo,
    receiver,
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

  return { result: withdraw };
};

module.exports = {
  withdrawFromHive,
};
