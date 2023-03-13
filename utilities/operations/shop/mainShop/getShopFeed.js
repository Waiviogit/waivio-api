const { User } = require('models');
const getShopDepartments = require('./getShopDepartments');
const getDepartmentFeed = require('./getDepartmentFeed');

module.exports = async ({
  userName,
  app,
  locale,
  countryCode,
  filter,
  department,
  excludedDepartments,
  path = [],
  skip,
  limit,
} = {}) => {
  let user;
  if (userName) {
    ({ user } = await User.getOne(userName));
  }
  const {
    result: mainDepartments,
    error,
  } = await getShopDepartments({
    name: department,
    excluded: excludedDepartments,
  });
  if (error) return { error };

  const departments = mainDepartments.slice(skip, skip + limit);

  const result = await Promise.all(departments.map(async (d) => getDepartmentFeed({
    department: d.name,
    app,
    userName,
    user,
    locale,
    countryCode,
    filter,
    path: [...path, d.name],
  })));

  return {
    result,
    hasMore: mainDepartments.length > departments.length + skip,
  };
};
