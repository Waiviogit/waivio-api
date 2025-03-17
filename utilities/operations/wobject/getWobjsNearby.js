const _ = require('lodash');
const { Wobj } = require('../../../models');
const searchHelper = require('../../helpers/searchHelper');
const { REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');

module.exports = async ({
  authorPermlink, app, skip, limit, radius,
}) => {
  const wobjects = [];
  const appInfo = await searchHelper.getAppInfo({ app });
  const { result: wobj, error: wobjErr } = await Wobj.findOne(
    { author_permlink: authorPermlink },
    { map: 1, object_type: 1 },
  );
  if (wobjErr || !wobj) return { wobjects };

  const coordinates = _.get(wobj, 'map.coordinates');
  if (_.isEmpty(coordinates)) return { wobjects };

  const pipeline = makeNearbyPipe({
    coordinates, radius, skip, limit, ...appInfo, authorPermlink, object_type: wobj.object_type,
  });
  const { wobjects: wobjs, error } = await Wobj.fromAggregation(pipeline);
  if (error) return { wobjects };

  return { wobjects: wobjs };
};

const makeNearbyPipe = ({
  coordinates, radius, skip = 0, limit = 5, crucialWobjects,
  forSites, authorPermlink, object_type,
}) => {
  const pipeline = [];
  pipeline.push({
    $geoNear: {
      near: { type: 'Point', coordinates },
      distanceField: 'proximity',
      maxDistance: radius,
      spherical: true,
    },
  });
  const matchCond = {
    $match: {
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      author_permlink: { $ne: authorPermlink },
      object_type,
    },
  };
  if (forSites) {
    matchCond.$match = {
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      $and: [
        { author_permlink: { $ne: authorPermlink } }, { author_permlink: { $in: crucialWobjects } },
      ],
      object_type,
    };
  }
  pipeline.push(matchCond);
  pipeline.push({ $skip: skip }, { $limit: limit });
  return pipeline;
};
