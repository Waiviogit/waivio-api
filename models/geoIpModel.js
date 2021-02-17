const { GeoIp } = require('database').models;

exports.findOne = async (ip) => {
  try {
    return { result: await GeoIp.findOne({ network: ip }).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOneAndUpdate = async (data) => {
  try {
    const result = await GeoIp.findOneAndUpdate(
      { network: data.ip },
      data,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    ).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};
