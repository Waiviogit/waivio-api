const { Post, User } = require('models');
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
  const { user } = await User.getOne(userName);
  const wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });
  const { result: departments } = await getUserDepartments
    .getTopDepartments({ userName, wobjectsFromPosts });

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
