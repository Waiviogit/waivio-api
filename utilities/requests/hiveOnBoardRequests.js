const { HIVE_ON_BOARD } = require('constants/requestData');
const axios = require('axios');
const _ = require('lodash');

exports.validateTicketRequest = async (ticket) => {
  try {
    const result = await axios.get(
      `${HIVE_ON_BOARD.HOST}${HIVE_ON_BOARD.BASE_URL}${HIVE_ON_BOARD.TICKETS}/${ticket}`,
    );
    return { valid: _.get(result, 'data.valid') };
  } catch (error) {
    return { error };
  }
};
