const { Post, User } = require('models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const getUserDepartments = require('./getUserDepartments');
const getUserDepartmentFeed = require('./getUserDepartmentFeed');

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
}) => {
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  const wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });
  const { result: userDepartments } = await getUserDepartments
    .getTopDepartments({
      userName, wobjectsFromPosts, user, name: department, excluded: excludedDepartments,
    });

  const departments = userDepartments.slice(skip, skip + limit);

  const result = await Promise.all(departments.map(async (d) => getUserDepartmentFeed({
    department: d.name,
    app,
    locale,
    countryCode,
    filter,
    wobjectsFromPosts,
    user,
    userName,
    follower,
    path: [...path, d.name],
  })));

  return {
    result,
    hasMore: userDepartments.length > departments.length + skip,
  };
};
