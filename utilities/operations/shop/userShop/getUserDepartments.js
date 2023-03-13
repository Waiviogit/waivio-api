const {
  Wobj, Post, Department, User, userShopDeselectModel,
} = require('models');
const { REMOVE_OBJ_STATUSES, SHOP_OBJECT_TYPES } = require('constants/wobjectsData');
const _ = require('lodash');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const { UNCATEGORIZED_DEPARTMENT } = require('constants/departments');
const shopHelper = require('utilities/helpers/shopHelper');

exports.getTopDepartments = async ({
  userName,
  wobjectsFromPosts,
  skip = 0,
  limit = 10,
  user,
  name,
  excluded,
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

  const deselectLinks = await userShopDeselectModel.findUsersLinks({ userName });

  const { result } = await Wobj.findObjects({
    filter: {
      $or: orFilter,
      object_type: { $in: SHOP_OBJECT_TYPES },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...(!_.isEmpty(deselectLinks) && { author_permlink: { $nin: deselectLinks } }),
    },
    projection: { departments: 1 },
  });

  const uncategorized = _.filter(result, (r) => _.isEmpty(r.departments));

  const names = _.uniq(
    _.flatten(_.map(result, (item) => _.map(item.departments, (department) => department))),
  );
  const { result: allDepartments } = await Department.find({
    filter: { name: { $in: names } },
    options: {
      sort: { sortScore: 1, objectsCount: -1 },
      options: { skip, limit: limit + 1 },
    },
  });

  const filteredDepartments = name
    ? shopHelper.secondaryFilterDepartment({ allDepartments, name, excluded })
    : shopHelper.mainFilterDepartment(allDepartments);

  const mappedDepartments = shopHelper.subdirectoryMap({ filteredDepartments, allDepartments });
  const orderedDepartments = shopHelper.orderBySubdirectory(mappedDepartments);

  if (!name && uncategorized.length) {
    orderedDepartments.push({
      name: UNCATEGORIZED_DEPARTMENT,
      subdirectory: false,
    });
  }

  return { result: orderedDepartments };
};
