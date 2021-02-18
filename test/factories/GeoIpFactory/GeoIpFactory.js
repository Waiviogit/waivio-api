const { GeoIp, faker } = require('test/testHelper');

const Create = async ({
  ip, longitude, latitude, onlyData,
} = {}) => {
  const ipData = {
    network: ip || faker.internet.ip(),
    longitude: longitude || parseFloat(faker.address.longitude()),
    latitude: latitude || parseFloat(faker.address.latitude()),
  };
  if (onlyData) return ipData;
  const geoIp = new GeoIp(ipData);
  await geoIp.save();

  return geoIp.toObject();
};

module.exports = { Create };
