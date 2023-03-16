const {
  Wobj, Post, User, userShopDeselectModel,
} = require('models');
const { REMOVE_OBJ_STATUSES, SHOP_OBJECT_TYPES } = require('constants/wobjectsData');
const _ = require('lodash');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const { UNCATEGORIZED_DEPARTMENT, OTHERS_DEPARTMENT } = require('constants/departments');
const shopHelper = require('utilities/helpers/shopHelper');

exports.getTopDepartments = async ({
  userName,
  wobjectsFromPosts,
  user,
  name,
  excluded,
  path,
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
  const allDepartments = shopHelper.getDepartmentsFromObjects(result, path);

  const filteredDepartments = name && name !== OTHERS_DEPARTMENT
    ? shopHelper.secondaryFilterDepartment({
      allDepartments, name, excluded, path,
    })
    : shopHelper.mainFilterDepartment(allDepartments);

  const mappedDepartments = shopHelper.subdirectoryMap({ filteredDepartments, allDepartments });
  const orderedDepartments = shopHelper.orderBySubdirectory(mappedDepartments);

  if (orderedDepartments.length > 20 && name !== OTHERS_DEPARTMENT) {
    orderedDepartments.splice(20, orderedDepartments.length);
    orderedDepartments.push({
      name: OTHERS_DEPARTMENT,
      subdirectory: true,
    });
  }

  if (name === OTHERS_DEPARTMENT) {
    orderedDepartments.splice(0, 20);
  }

  if (!name && uncategorized.length) {
    orderedDepartments.push({
      name: UNCATEGORIZED_DEPARTMENT,
      subdirectory: false,
    });
  }

  return { result: orderedDepartments };
};
