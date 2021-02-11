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

  const condition = {
    map: {
      $geoWithin: {
        $box: [bottomPoint, topPoint],
      },
    },
    object_type: { $in: 'restaurant' },
  };
  if (forSites) condition.author_permlink = { $in: crucialWobjects };

  const { result: wobjects, error } = await Wobj.find(condition, {}, { weight: -1 }, 0, 100);

  const { min } = distanceInMBetweenEarthCoordinates(bottomPoint, topPoint);

  if (error) return { error };
  if (userName) ({ user } = await User.getOne(userName));

  await campaignsHelper.addCampaignsToWobjects({
    wobjects, user, simplified: true, app,
  });

  for (let i = 0; i < wobjects.length; i++) {
    for (let j = 0; j < wobjects.length; j++) {
      if (i !== j) {
        const { distance } = distanceInMBetweenEarthCoordinates(
          wobjects[i].map.coordinates,
          wobjects[j].map.coordinates,
        );
        const cond1 = distance < min;
        const cond2 = wobjects[i].weight > wobjects[j].weight;
        const cond3 = !_.has(wobjects[j], 'campaigns');
        if (cond1 && cond2 && cond3) wobjects[j].filter = true;
      }
    }
  }

  return {
    result: {
      wobjects: _.slice(_.filter(wobjects, (el) => !el.filter), 0, 50),
      hasMore: wobjects.length > limit,
    },
  };
};

const distanceInMBetweenEarthCoordinates = ([lon1, lat1], [lon2, lat2]) => {
  const earthRadiusM = 6371000;

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const lat1Rad = degreesToRadians(lat1);
  const lat2Rad = degreesToRadians(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadiusM * c;

  return {
    min: distance > 1000 ? Math.round(distance / 80) : 0,
    distance,
  };
};

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;
