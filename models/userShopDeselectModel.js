const { UserShopDeselect } = require('../database').models;

const find = async ({ filter, projection, options }) => {
  try {
    const result = await UserShopDeselect.find(filter, projection, options).lean();

    return { result };
  } catch (error) {
    return { error };
  }
};

const findUsersLinks = async ({ userName, names }) => {
  const { result, error } = await find({
    filter: { userName: userName || { $in: names } },
  });
  if (error) return [];

  return result.map((el) => el.authorPermlink);
};

module.exports = {
  findUsersLinks,
  find,
};
