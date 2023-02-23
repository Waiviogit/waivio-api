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
}) => {
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  const wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });
  const { result: departments } = await getUserDepartments
    .getTopDepartments({ userName, wobjectsFromPosts, user });

  const result = await Promise.all(departments.map(async (department) => getUserDepartmentFeed({
    department: department.name,
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
