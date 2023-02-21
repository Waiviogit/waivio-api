const { User } = require('models');
const getShopDepartments = require('./getShopDepartments');
const getDepartmentFeed = require('./getDepartmentFeed');

module.exports = async ({
  userName,
  app,
  locale,
  countryCode,
  filter,
} = {}) => {
  let user;
  if (userName) {
    ({ user } = await User.getOne(userName));
  }
  const {
    result: departments,
    error,
  } = await getShopDepartments();
  if (error) return { error };

  const result = await Promise.all(departments.map(async (department) => getDepartmentFeed({
    department: department.name,
    app,
    userName,
    user,
    locale,
    countryCode,
    filter,
  })));

  return { result };
};
