const { Wobj, Post, Department } = require('models');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const _ = require('lodash');
const { User } = require('../../../models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');

exports.getTopDepartments = async ({
  userName,
  wobjectsFromPosts,
  skip = 0,
  limit = 10,
  user,
}) => {
  if (!user) ({ user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP));
  const hideLinkedObjects = _.get(user, 'user_metadata.settings.shop.hideLinkedObjects', false);
  if (!wobjectsFromPosts) {
    wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });
  }

  const orFilter = [
    { 'authority.ownership': userName },
    { 'authority.administrative': userName },
  ];
  if (!_.isEmpty(wobjectsFromPosts) && !hideLinkedObjects) {
    orFilter.push({ author_permlink: { $in: wobjectsFromPosts } });
  }

  const { result } = await Wobj.findObjects({
    filter: {
      $or: orFilter,
      object_type: { $in: [OBJECT_TYPES.BOOK, OBJECT_TYPES.PRODUCT] },
    },
    projection: { departments: 1 },
  });

  const names = _.uniq(
    _.flatten(_.map(result, (item) => _.map(item.departments, (department) => department))),
  );
  const { result: departments } = await Department.find({
    filter: { name: { $in: names } },
    options: {
      sort: { sortScore: 1, objectsCount: -1 },
      options: { skip, limit: limit + 1 },
    },
  });

  return { result: _.take(departments, limit), hasMore: departments.length > limit };
};
