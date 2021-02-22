const ipRequest = require('utilities/requests/ipRequest');
const { geoIpModel } = require('models');
const _ = require('lodash');

exports.getLocation = async (ip) => {
  if (!ip) return { longitude: 0, latitude: 0 };

  const { result } = await geoIpModel.findOne(ip);

  if (!result) {
    const { geoData } = await ipRequest.getIp(ip);
    if (_.get(geoData, 'lat') && _.get(geoData, 'lon')) {
      await geoIpModel.findOneAndUpdate({
        ip, longitude: parseFloat(geoData.lon), latitude: parseFloat(geoData.lat),
      });
    }
    return {
      longitude: parseFloat(_.get(geoData, 'lon', '0')),
      latitude: parseFloat(_.get(geoData, 'lat', '0')),
    };
  }
  return {
    longitude: result.longitude,
    latitude: result.latitude,
  };
};

exports.putLocation = async ({ ip, longitude, latitude }) => {
  const { result, error } = await geoIpModel.findOneAndUpdate({
    ip,
    longitude,
    latitude,
  });
  if (error) return { error };

  return {
    longitude: result.longitude,
    latitude: result.latitude,
  };
};
