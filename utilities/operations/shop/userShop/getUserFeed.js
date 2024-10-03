const { User } = require('models');
const _ = require('lodash');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const getUserDepartments = require('./getUserDepartments');
const getUserDepartmentFeed = require('./getUserDepartmentFeed');
const shopHelper = require('../../../helpers/shopHelper');

module.exports = async ({
  userName,
  app,
  locale,
  countryCode,
  filter,
  follower,
  department,
  excludedDepartments,
  path = [],
  skip,
  limit,
  categoryLimit,
  schema,
}) => {
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);

  const userFilter = await shopHelper.getUserFilter({ userName, app, schema });

  const { result: userDepartments } = await getUserDepartments
    .getTopDepartments({
      userName,
      user,
      name: department,
      excluded: excludedDepartments,
      path,
      userFilter,
      app,
      schema,
    });

  const isEmptyFilter = _.isEmpty(_.get(filter, 'tagCategory')) && !_.get(filter, 'rating');

  const departments = isEmptyFilter ? userDepartments.slice(skip, skip + limit) : userDepartments;

  const result = await Promise.all(departments.map(async (d) => getUserDepartmentFeed({
    department: d.name,
    app,
    locale,
    countryCode,
    filter,
    user,
    userName,
    follower,
    path: [...path, d.name],
    userFilter,
    limit: categoryLimit,
    schema,
  })));

  const hasMore = userDepartments.length > departments.length + skip;
  if (!isEmptyFilter) {
    const filtered = _.filter(result, (el) => !_.isEmpty(el.wobjects));
    const filterResult = filtered.slice(skip, skip + limit);
    const filterHasMore = filtered.length > filterResult.length + skip;
    return {
      result: filterResult,
      hasMore: filterHasMore,
    };
  }

  return {
    result,
    hasMore,
  };
};
