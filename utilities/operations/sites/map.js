const _ = require('lodash');
const { Wobj, User } = require('models');
const { campaignsHelper, sitesHelper } = require('utilities/helpers');

exports.getData = async ({
  topPoint, bottomPoint, limit, userName, skip,
}) => {
  let user;
  const { result: app } = await sitesHelper.getSessionApp();
  const crucialWobjects = _.get(app, 'supported_objects', []);
  const authorities = _.get(app, 'authority', []);
  const supportedTypes = _.get(app, 'supported_object_types', []);
  const forSites = _.get(app, 'inherited');

  let condition = {
    'map.coordinates': {
      $geoWithin: {
        $box: [bottomPoint, topPoint],
      },
    },
    object_type: { $in: supportedTypes },
  };
  if (forSites) {
    condition = Object.assign(condition, {
      $or: [{
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.ownership', authorities] } },
            0,
          ],
        },
      }, {
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.administrative', authorities] } },
            0,
          ],
        },
      },
      { author_permlink: { $in: crucialWobjects } },
      ],
    });
  }
  const { result: wobjects, error } = await Wobj.find(condition, {}, { weight: -1 }, 0, limit + 1);

  if (error) return { error };
  if (userName) ({ user } = await User.getOne(userName));

  await campaignsHelper.addCampaignsToWobjects({
    wobjects, user, simplified: true,
  });

  return {
    result: {
      wobjects: _.slice(wobjects, skip, limit + skip),
      hasMore: wobjects.length > limit,
    },
  };
};
