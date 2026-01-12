const _ = require('lodash');
const { LOW_PRIORITY_STATUS_FLAGS, FIELDS_NAMES } = require('../../../constants/wobjectsData');
const {
  Wobj, ObjectType, User,
} = require('../../../models');
const { campaignsHelper, objectTypeHelper } = require('../../helpers');
const { checkForSocialSite } = require('../../helpers/sitesHelper');
const { getAppAuthorities } = require('../../helpers/appHelper');

const validateInput = ({ filter, sort }) => {
  if (filter) {
    // validate map filter
    if (filter.map) {
      if (!filter.map.coordinates || !Array.isArray(filter.map.coordinates)
          || filter.map.coordinates.length !== 2 || !filter.map.radius) {
        return false;
      }
    }
    /** validate another specific filters */
  }
  if (sort) {
    if (sort === 'proximity' && !_.get(filter, 'map')) return false;
  }
  return true;
};

const getWobjWithFilters = async ({
  objectType, filter, limit = 30, skip = 0, sort = 'weight', nsfw, app,
}) => {
  const aggregationPipeline = [];
  const social = checkForSocialSite(app?.parentHost ?? '');

  if (!validateInput({ filter, sort })) {
    return { error: { status: 422, message: 'Filter or Sort param is not valid!' } };
  }
  // special filter map
  if (filter?.map) {
    aggregationPipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: [filter.map.coordinates[1], filter.map.coordinates[0]] },
        distanceField: 'proximity',
        maxDistance: filter.map.radius,
        spherical: true,
      },
    });
    aggregationPipeline.push({ $match: { 'status.title': { $nin: LOW_PRIORITY_STATUS_FLAGS } } });
    delete filter.map;
  }
  // special filter searchString
  if (filter?.searchString) {
    const searchString = filter.searchString
      .replace(/[.,%?+*|{}[\]()<>“”^'"\\\-_=!&$:]/g, '')
      .trim();

    aggregationPipeline.push({
      $match: {
        $or: [
          { $text: { $search: `\"${searchString}\"` } },
          { // if 4-th symbol is "-" - search by "author_permlink" too
            author_permlink: { $regex: `${_.get(filter.searchString, '[3]') === '-' ? `^${filter.searchString}` : '_'}`, $options: 'i' },
          },
        ],
      },
    });
    delete filter.searchString;
  }
  aggregationPipeline.push({
    $match: {
      object_type: objectType,
      'status.title': { $nin: nsfw ? ['nsfw', ...LOW_PRIORITY_STATUS_FLAGS] : LOW_PRIORITY_STATUS_FLAGS },
    },
  });
  // special filter TAG_CATEGORY
  if (_.get(filter, FIELDS_NAMES.TAG_CATEGORY)) {
    const condition = [];
    for (const category of filter.tagCategory) {
      for (const categoryItem of category.tags) {
        condition.push({
          fields: {
            $elemMatch: {
              name: FIELDS_NAMES.CATEGORY_ITEM,
              body: categoryItem,
              tagCategory: category.categoryName,
              weight: { $gte: 0 },
            },
          },
        });
      }
    }
    if (condition.length)aggregationPipeline.push({ $match: { $and: condition } });
    delete filter.tagCategory;
  }

  if (!_.isEmpty(filter)) {
    /** place here additional filters */
    for (const filterItem in filter) {
      for (const filterValue of filter[filterItem]) {
        const cond = {
          $match:
                { fields: { $elemMatch: { name: filterItem, body: filterValue } } },
        };
        // additional filter for field "rating"

        if (filterItem === FIELDS_NAMES.RATING) {
          cond.$match.fields.$elemMatch.average_rating_weight = { $gte: 8 };
        }
        aggregationPipeline.push(cond);
      }
    }
  }
  if (social) {
    const authorities = getAppAuthorities(app);
    aggregationPipeline.push({
      $match: {
        'authority.administrative': { $in: authorities },
      },
    });
  }

  let sortStage;
  if (sort === 'newestFirst') {
    sortStage = { $sort: { _id: -1 } };
  } else if (sort === 'oldestFirst') {
    sortStage = { $sort: { _id: 1 } };
  } else {
    sortStage = { $sort: { [sort]: sort !== 'proximity' ? -1 : 1, _id: 1 } };
  }

  aggregationPipeline.push(
    sortStage,
    { $skip: skip },
    { $limit: limit },
  );
  // get wobjects by pipeline
  const { wobjects, error: aggrError } = await Wobj.fromAggregation(aggregationPipeline);

  if (aggrError) {
    if (aggrError.status === 404) return { wobjects: [] };
    return { error: aggrError };
  }
  return { wobjects };
};

module.exports = async ({
  name, filter, wobjLimit, wobjSkip, sort, userName, simplified, appName, app,
}) => {
  let tagCategory = [];
  const { objectType, error: objTypeError } = await ObjectType.getOne({ name });
  if (objTypeError) return { error: objTypeError };
  if (_.has(objectType, 'supposed_updates')) {
    tagCategory = _.get(_.find(objectType.supposed_updates, (o) => o.name === 'tagCategory'), 'values', []);
  }
  _.get(tagCategory, 'length')
    ? objectType.tagsForFilter = await objectTypeHelper.getTagCategory(tagCategory, filter, name)
    : objectType.tagsForFilter = [];
  /** search user for check allow nsfw flag */
  const { user } = await User.getOne(userName, '+user_metadata');
  /** get related wobjects for current object type */
  const { wobjects, error: wobjError } = await getWobjWithFilters({
    objectType: name,
    filter,
    limit: wobjLimit + 1,
    skip: wobjSkip,
    sort,
    nsfw: _.get(user, 'user_metadata.settings.showNSFWPosts', false),
    app,
  });
  if (wobjError) return { error: wobjError };

  /** Fill campaigns for some object types,
   * be careful, we pass objects by reference and in this method we will directly modify them */
  await campaignsHelper.addCampaignsToWobjects({
    name, wobjects, user, appName, simplified,
  });
  objectType.hasMoreWobjects = wobjects.length > wobjLimit;
  objectType.related_wobjects = wobjects.slice(0, wobjLimit);
  return { objectType };
};
