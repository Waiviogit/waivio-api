const _ = require('lodash');
const MMDBReader = require('mmdb-reader');
const { ERROR_MESSAGE, RESPONSE_STATUS } = require('constants/common');

module.exports = async (ip) => {
  try {
    const reader = new MMDBReader(process.env.MMDB_PATH);
    const result = reader.lookup(ip);
    return _.has(result, 'location')
      ? { location: _.pick(result.location, ['latitude', 'longitude']) }
      : { error: { status: RESPONSE_STATUS.NOT_FOUND, message: ERROR_MESSAGE.NOT_FOUND } };
  } catch (error) {
    return { error: { status: RESPONSE_STATUS.NOT_FOUND, message: ERROR_MESSAGE.NOT_FOUND } };
  }
};
