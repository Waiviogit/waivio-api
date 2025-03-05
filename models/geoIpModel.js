const { GeoIp } = require('../database').models;

exports.findOne = async (ip) => {
  try {
    return { result: await GeoIp.findOne({ ip }).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOneAndUpdate = async (data) => {
  try {
    const result = await GeoIp.findOneAndUpdate(
      { ip: data.ip },
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
