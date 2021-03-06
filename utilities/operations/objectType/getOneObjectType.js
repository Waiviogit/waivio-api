const { LOW_PRIORITY_STATUS_FLAGS, FIELDS_NAMES } = require('constants/wobjectsData');
const {
  Wobj, ObjectType, User,
} = require('models');
const _ = require('lodash');
const { campaignsHelper, objectTypeHelper } = require('utilities/helpers');

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
  objectType, filter, limit = 30, skip = 0, sort = 'weight', nsfw,
}) => {
  const aggregationPipeline = [];

  if (!validateInput({ filter, sort })) {
    return { error: { status: 422, message: 'Filter or Sort param is not valid!' } };
  }
  // special filter map
  if (filter && filter.map) {
    aggregationPipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: [filter.map.coordinates[1], filter.map.coordinates[0]] },
        distanceField: 'proximity',
        maxDistance: filter.map.radius,
        spherical: true,
        limit: 100000,
      },
    });
    aggregationPipeline.push({ $match: { 'status.title': { $nin: LOW_PRIORITY_STATUS_FLAGS } } });
    delete filter.map;
  }
  aggregationPipeline.push({
    $match: {
      object_type: objectType,
      'status.title': { $nin: nsfw ? ['nsfw', ...LOW_PRIORITY_STATUS_FLAGS] : LOW_PRIORITY_STATUS_FLAGS },
    },
  });

  // special filter searchString
  if (_.get(filter, 'searchString')) {
    aggregationPipeline.push({
      $match: {
        $or: [
          { fields: { $elemMatch: { name: 'name', body: { $regex: `\\b${filter.searchString}.*\\b`, $options: 'i' } } } },
          { // if 4-th symbol is "-" - search by "author_permlink" too
            author_permlink: { $regex: `${_.get(filter.searchString, '[3]') === '-' ? `^${filter.searchString}` : '_'}`, $options: 'i' },
          },
        ],
      },
    });
    delete filter.searchString;
  }
  // special filter TAG_CATEGORY
  if (_.get(filter, FIELDS_NAMES.TAG_CATEGORY)) {
    const condition = [];
    for (const category of filter.tagCategory) {
      condition.push({
        fields: {
          $elemMatch: {
            name: FIELDS_NAMES.CATEGORY_ITEM,
            body: { $in: category.tags },
            tagCategory: category.categoryName,
          },
        },
      });
    }
    if (condition.length)aggregationPipeline.push({ $match: { $or: condition } });
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
  aggregationPipeline.push(
    { $sort: { [sort]: sort !== 'proximity' ? -1 : 1 } },
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
  name, filter, wobjLimit, wobjSkip, sort, userName, simplified, appName,
}) => {
  let tagCategory = [];
  const { objectType, error: objTypeError } = await ObjectType.getOne({ name });
  if (objTypeError) return { error: objTypeError };
  if (_.has(objectType, 'supposed_updates')) {
    tagCategory = _.get(_.find(objectType.supposed_updates, (o) => o.name === 'tagCategory'), 'values', []);
  }
  _.get(tagCategory, 'length')
    ? objectType.tagsForFilter = await objectTypeHelper.getTagCategory(tagCategory, filter)
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
