const { User } = require('models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const shopHelper = require('utilities/helpers/shopHelper');
const _ = require('lodash');
const getWobjectDepartments = require('./getWobjectDepartments');
const getWobjectDepartmentFeed = require('./getWobjectDepartmentFeed');

const getWobjectMainFeed = async ({
  follower,
  app,
  authorPermlink,
  countryCode,
  locale,
}) => {
  const { user } = await User.getOne(follower, SELECT_USER_CAMPAIGN_SHOP);
  const { filter, error } = await shopHelper.getWobjectFilter({ app, authorPermlink });

  if (error) return { error };
  const { result: departments } = await getWobjectDepartments({
    app, authorPermlink, filter,
  });

  if (_.isEmpty(departments)) return { result: [] };

  const result = await Promise.all(departments.map(async (department) => getWobjectDepartmentFeed({
    department: department.name,
    app,
    locale,
    countryCode,
    filter,
    user,
    follower,
  })));

  return { result };
};

module.exports = getWobjectMainFeed;
