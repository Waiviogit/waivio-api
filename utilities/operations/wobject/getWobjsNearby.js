const _ = require('lodash');
const { Wobj } = require('models');
const searchHelper = require('utilities/helpers/searchHelper');

module.exports = async ({
  authorPermlink, app, skip, limit, radius,
}) => {
  const wobjects = [];
  const appInfo = await searchHelper.getAppInfo({ app });
  const { result: wobj, error: wobjErr } = await Wobj.findOne({ author_permlink: authorPermlink });
  if (wobjErr || !wobj) return { wobjects };

  const coordinates = _.get(wobj, 'map.coordinates');
  if (_.isEmpty(coordinates)) return { wobjects };

  const pipeline = makeNearbyPipe({
    coordinates, radius, skip, limit, ...appInfo, authorPermlink,
  });
  const { wobjects: wobjs, error } = await Wobj.fromAggregation(pipeline);
  if (error) return { wobjects };

  return { wobjects: wobjs };
};

const makeNearbyPipe = ({
  coordinates, radius, skip = 0, limit = 5, crucialWobjects, supportedTypes,
  forSites, authorPermlink,
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
      'status.title': { $nin: ['unavailable', 'nsfw', 'relisted'] },
      author_permlink: { $ne: authorPermlink },
    },
  };
  if (!_.isEmpty(supportedTypes)) matchCond.$match.object_type = { $in: supportedTypes };
  if (forSites) matchCond.$match.author_permlink = { $in: crucialWobjects };
  pipeline.push(matchCond);
  pipeline.push({ $skip: skip }, { $limit: limit });
  return pipeline;
};
