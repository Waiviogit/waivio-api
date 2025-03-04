const ipRequest = require('../../requests/ipRequest');
const { geoIpModel } = require('../../../models');
const _ = require('lodash');

exports.getLocation = async (ip) => {
  if (!ip) {
    return {
      longitude: 0,
      latitude: 0,
    };
  }

  const { result } = await geoIpModel.findOne(ip);
  if (result) {
    return {
      longitude: result.longitude,
      latitude: result.latitude,
    };
  }

  const {
    geoData,
    error,
  } = await ipRequest.getIp(ip);
  if (error) {
    return {
      longitude: 0,
      latitude: 0,
    };
  }
  const longitude = parseFloat(_.get(geoData, 'lon') || '0');
  const latitude = parseFloat(_.get(geoData, 'lat') || '0');

  if (longitude && latitude) {
    await geoIpModel.findOneAndUpdate({
      ip,
      longitude,
      latitude,
    });
  }
  return {
    longitude,
    latitude,
  };
};

exports.putLocation = async ({
  ip,
  longitude,
  latitude,
}) => {
  const {
    result,
    error,
  } = await geoIpModel.findOneAndUpdate({
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
