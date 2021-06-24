const { CURRENCIES_API } = require('constants/requestData');
const axios = require('axios');

exports.getCurrencyLatestRate = async (params) => {
  try {
    const result = await axios.get(
      `${CURRENCIES_API.HOST}${CURRENCIES_API.BASE_URL}${CURRENCIES_API.RATE}${CURRENCIES_API.LATEST}`,
      { params },
    );
    if (!result) return { error: { status: 404, message: 'Not Found' } };
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};
