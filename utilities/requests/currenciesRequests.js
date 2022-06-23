const { CURRENCIES_API } = require('constants/requestData');
const axios = require('axios');
const { REQUEST_TIMEOUT } = require('../../constants/common');

exports.getCurrencyLatestRate = async (params) => {
  try {
    const result = await axios.get(
      `${CURRENCIES_API.HOST}${CURRENCIES_API.BASE_URL}${CURRENCIES_API.RATE}${CURRENCIES_API.LATEST}`,
      {
        params,
        timeout: REQUEST_TIMEOUT,
      },
    );
    if (!result) return { error: { status: 404, message: 'Not Found' } };
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};
