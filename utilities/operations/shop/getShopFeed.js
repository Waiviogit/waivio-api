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
} = {}) => {
  let user;
  if (userName) {
    ({ user } = await User.getOne(userName));
  }
  const {
    result: departments,
    error,
  } = await getShopDepartments({
    name: department,
    excluded: excludedDepartments,
  });
  if (error) return { error };

  const result = await Promise.all(departments.map(async (d) => getDepartmentFeed({
    department: d.name,
    app,
    userName,
    user,
    locale,
    countryCode,
    filter,
  })));

  return { result };
};
