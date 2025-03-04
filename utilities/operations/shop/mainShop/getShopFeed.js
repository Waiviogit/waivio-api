const _ = require('lodash');
const { User } = require('../../../../models');
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
    path,
  });
  if (error) return { error };

  const isEmptyFilter = _.isEmpty(_.get(filter, 'tagCategory')) && !_.get(filter, 'rating');
  const departments = isEmptyFilter ? mainDepartments.slice(skip, skip + limit) : mainDepartments;

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

  const hasMore = mainDepartments.length > departments.length + skip;
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
