const axios = require('axios');
const _ = require('lodash');
const { GEO_IP_API } = require('../../constants/requestData');
const { REQUEST_TIMEOUT } = require('../../constants/common');

exports.getIp = async (ip) => {
  try {
    const result = await axios.get(`${GEO_IP_API}${ip}?key=${process.env.GEO_IP_KEY}`, { timeout: REQUEST_TIMEOUT });
    return { geoData: _.get(result, 'data') };
  } catch (error) {
    return { error };
  }
};
