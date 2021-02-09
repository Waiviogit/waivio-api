const _ = require('lodash');
const { Wobj, User } = require('models');
const { campaignsHelper, sitesHelper } = require('utilities/helpers');

exports.getData = async ({
  topPoint, bottomPoint, limit, userName, skip, app,
}) => {
  let user;
  const crucialWobjects = _.get(app, 'supported_objects', []);
  const supportedTypes = _.get(app, 'supported_object_types', []);
  const forSites = _.get(app, 'inherited');

  const { min, max, center } = sitesHelper
    .distanceInMBetweenEarthCoordinates(topPoint, bottomPoint);

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
