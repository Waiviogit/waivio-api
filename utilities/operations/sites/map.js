const _ = require('lodash');
const { Wobj, User } = require('models');
const { campaignsHelper } = require('utilities/helpers');

exports.getData = async ({
  topPoint, bottomPoint, limit, userName, skip, app,
}) => {
  let user;
  const crucialWobjects = _.get(app, 'supported_objects', []);
  const supportedTypes = _.get(app, 'supported_object_types', []);
  const forSites = _.get(app, 'inherited');

  const { min, max, center } = distanceInmBetweenEarthCoordinates(topPoint, bottomPoint);

  const condition = {
    map: {
      $near:
        {
          $geometry: { type: 'Point', coordinates: center },
          $minDistance: min,
          $maxDistance: max,
        },
    },
    object_type: { $in: supportedTypes },
  };
  if (forSites) condition.author_permlink = { $in: crucialWobjects };

  const { result: wobjects, error } = await Wobj.find(condition, {}, { weight: -1 }, 0, limit + 1);

  if (error) return { error };
  if (userName) ({ user } = await User.getOne(userName));

  await campaignsHelper.addCampaignsToWobjects({
    wobjects, user, simplified: true, app,
  });

  return {
    result: {
      wobjects: _.slice(wobjects, skip, limit + skip),
      hasMore: wobjects.length > limit,
    },
  };
};

const distanceInmBetweenEarthCoordinates = ([lon1, lat1], [lon2, lat2]) => {
  const earthRadiusM = 6371000;
  const center = [mediumPoint(lon1, lon2), mediumPoint(lat1, lat2)];

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const lat1Rad = degreesToRadians(lat1);
  const lat2Rad = degreesToRadians(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadiusM * c;

  return {
    min: Math.round(distance / 40),
    max: Math.round(distance / 2),
    center,
  };
};

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;

const mediumPoint = (point1, point2) => (point1 + point2) / 2;
