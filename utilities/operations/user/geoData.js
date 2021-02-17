const { getIpFromHeaders } = require('utilities/helpers/sitesHelper');
const ipRequest = require('utilities/requests/ipRequest');
const { geoIpModel } = require('models');
const _ = require('lodash');

exports.get = async (req) => {
  const ip = getIpFromHeaders(req);
  if (!ip) return { longitude: '0.0', latitude: '0.0' };

  const { result } = await geoIpModel.findOne(ip);

  if (!result) {
    const { geoData } = await ipRequest.getIp(ip);
    if (_.get(geoData, 'lat') && _.get(geoData, 'lon')) {
      await geoIpModel.findOneAndUpdate({ ip, longitude: geoData.lon, latitude: geoData.lat });
    }
    return {
      longitude: _.get(geoData, 'lon', '0.0'),
      latitude: _.get(geoData, 'lat', '0.0'),
    };
  }
  return {
    longitude: result.longitude,
    latitude: result.latitude,
  };
};

exports.put = async ({ req, longitude, latitude }) => {
  const ip = getIpFromHeaders(req);
  if (!ip) return { error: { message: 'yo' } };

  const { result, error } = await geoIpModel.findOneAndUpdate({
    ip,
    longitude: longitude.toString(),
    latitude: latitude.toString(),
  });
  if (error) return { error };

  return {
    longitude: result.longitude,
    latitude: result.latitude,
  };
};
