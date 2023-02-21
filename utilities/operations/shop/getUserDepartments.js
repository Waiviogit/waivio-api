const { Wobj, Post, Department } = require('models');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const _ = require('lodash');

exports.getTopDepartments = async ({
  userName, wobjectsFromPosts, skip = 0, limit = 10,
}) => {
  if (!wobjectsFromPosts) {
    wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });
  }
  const orFilter = [
    { 'authority.ownership': userName },
    { 'authority.administrative': userName },
  ];
  if (!_.isEmpty(wobjectsFromPosts)) {
    orFilter.push({ author_permlink: { $in: wobjectsFromPosts } });
  }

  const { result } = await Wobj.findObjects({
    filter: {
      $or: orFilter,
      object_type: { $in: [OBJECT_TYPES.BOOK, OBJECT_TYPES.PRODUCT] },
    },
    projection: { departments: 1 },
    options: { skip, limit },
  });

  const names = _.uniq(
    _.flatten(_.map(result, (item) => _.map(item.departments, (department) => department))),
  );
  const { result: departments } = await Department.find({
    filter: { name: { $in: names } },
    options: { sort: { sortScore: 1, objectsCount: -1 } },
  });

  return { result: departments };
};
