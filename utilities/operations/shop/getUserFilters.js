const _ = require('lodash');
const {
  User,
  Post,
  userShopDeselectModel,
  Wobj,
  ObjectType,
} = require('models');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const {
  SHOP_OBJECT_TYPES,
  REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');

const getUniqArrayWithScore = (arr) => {
  const count = {};
  for (const str of arr) {
    count[str] = (count[str] || 0) + 1;
  }

  const unique = [];
  for (const str of arr) {
    if (!unique.some((obj) => obj.value === str)) {
      unique.push({ value: str, score: count[str] });
    }
  }
  return unique;
};

const getUserObjects = async ({ userName, tagCategory }) => {
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  const hideLinkedObjects = _.get(user, 'user_metadata.settings.shop.hideLinkedObjects', false);
  const wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName });

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
      ...(tagCategory && { 'fields.tagCategory': tagCategory }),
    },
    projection: { fields: 1 },
  });

  return result;
};

const getMoreTagFilters = async ({
  userName, tagCategory, skip, limit,
}) => {
  const objects = await getUserObjects({ userName, tagCategory });
  const fields = _.chain(objects)
    .map('fields')
    .flatten()
    .filter((f) => f.tagCategory === tagCategory)
    .value();

  const categoryFields = getUniqArrayWithScore(
    _.map(fields, 'body'),
  );
  const tags = _.chain(categoryFields).orderBy(['score'], ['desc']).map('value').slice(skip, skip + limit)
    .value();

  return {
    result: {
      tagCategory,
      tags,
      hasMore: categoryFields.length > tags.length + skip,
    },
  };
};

const getUserFilters = async ({
  userName,
}) => {
  const { result: objectTypes, error } = await ObjectType
    .find({ filter: { name: { $in: SHOP_OBJECT_TYPES } } });

  if (_.isEmpty(objectTypes) || error) {
    return { error: new Error('Categories not found') };
  }

  const tagCategories = _.reduce(objectTypes, (acc, el) => {
    const tagCategory = _.find(el.supposed_updates, (u) => u.name === 'tagCategory');
    if (!tagCategory) return acc;
    return [...acc, ...tagCategory.values];
  }, []);

  const objects = await getUserObjects({ userName });

  const fields = _.chain(objects)
    .map('fields')
    .flatten()
    .filter((f) => _.includes(tagCategories, f.tagCategory))
    .value();
  const tagCategoryFilters = [];

  for (const category of tagCategories) {
    const categoryFields = getUniqArrayWithScore(
      _.map(_.filter(fields, (f) => category === f.tagCategory), 'body'),
    );
    if (_.isEmpty(categoryFields)) continue;
    const tags = _.chain(categoryFields).orderBy(['score'], ['desc']).map('value').take(3)
      .value();

    tagCategoryFilters.push({
      tagCategory: category,
      tags,
      hasMore: categoryFields.length > tags.length,
    });
  }

  return {
    result: {
      rating: [10, 8, 6],
      tagCategoryFilters,
    },
  };
};

module.exports = {
  getUserFilters,
  getMoreTagFilters,
};
