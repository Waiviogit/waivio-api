const { GEO_IP_API } = require('constants/requestData');
const axios = require('axios');
const _ = require('lodash');

exports.getIp = async (ip) => {
  try {
    const result = await axios.get(`${GEO_IP_API}${ip}`);
    return { geoData: _.get(result, 'data') };
  } catch (error) {
    return { error };
  }
};
