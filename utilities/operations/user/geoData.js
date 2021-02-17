const { geoIpModel } = require('models');
const axios = require('axios');
const _ = require('lodash');

exports.get = async (req) => {
  const ip = getIpFromHeaders(req);
  const { result } = await geoIpModel.findOne(ip);
  // const {result} = await getIpRequest(ip)
};

exports.put = async () => {

};

// #TODO move to helpers
const getIpFromHeaders = (req) => (process.env.NODE_ENV === 'production'
  ? req.headers['x-forwarded-for']
  : req.headers['x-real-ip']);

const getIpRequest = async (ip) => {
  try {
    const result = await axios.get(`https://extreme-ip-lookup.com/json/${ip}`);
    return { result: _.get(result, 'data') };
  } catch (error) {
    return { error };
  }
};

(async () => {
  const { result } = await getIpRequest('1.0.66.0');
  console.log('yo');
})();
