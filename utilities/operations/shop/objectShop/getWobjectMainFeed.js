const { User } = require('../../../../models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../../constants/usersData');
const shopHelper = require('../../../helpers/shopHelper');
const _ = require('lodash');
const getWobjectDepartments = require('./getWobjectDepartments');
const getWobjectDepartmentFeed = require('./getWobjectDepartmentFeed');

const getWobjectMainFeed = async ({
  follower,
  app,
  authorPermlink,
  countryCode,
  locale,
  department,
  excludedDepartments,
  path = [],
  skip,
  limit,
  filter,
  categoryLimit,
}) => {
  const { user } = await User.getOne(follower, SELECT_USER_CAMPAIGN_SHOP);
  const { wobjectFilter, error } = await shopHelper.getWobjectFilter({
    app,
    authorPermlink,
    tagFilter: shopHelper.makeFilterCondition(filter),
  });

  if (error) return { error };
  const { result: objectDepartments } = await getWobjectDepartments({
    app, authorPermlink, wobjectFilter, name: department, excluded: excludedDepartments, path,
  });
  const isEmptyFilter = _.isEmpty(_.get(filter, 'tagCategory')) && !_.get(filter, 'rating');

  const departments = isEmptyFilter
    ? objectDepartments.slice(skip, skip + limit)
    : objectDepartments;

  if (_.isEmpty(departments)) return { result: [] };

  const result = await Promise.all(departments.map(async (d) => getWobjectDepartmentFeed({
    department: d.name,
    app,
    locale,
    countryCode,
    wobjectFilter,
    user,
    follower,
    path: [...path, d.name],
    filter,
    limit: categoryLimit,
  })));

  const hasMore = objectDepartments.length > departments.length + skip;
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

module.exports = getWobjectMainFeed;
