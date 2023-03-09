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
}) => {
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  const wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });
  const { result: departments } = await getUserDepartments
    .getTopDepartments({
      userName, wobjectsFromPosts, user, name: department, excluded: excludedDepartments,
    });

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
  })));
  return { result };
};
