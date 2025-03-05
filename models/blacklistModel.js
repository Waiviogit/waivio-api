const { Blacklist } = require('../database').models;

exports.find = async (condition, select = {}) => {
  try {
    return { blackLists: await Blacklist.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async ({ filter, projection, options }) => {
  try {
    return { result: await Blacklist.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getUserBlacklist = async (user = '') => {
  const { result } = await this.findOne({ filter: { user } });
  if (!result) return [];

  return [
    ...new Set([
      ...result?.blackList ?? [],
      ...(result?.followLists ?? []).map((fl) => fl.blackList).flat(1),
    ]),
  ];
};
