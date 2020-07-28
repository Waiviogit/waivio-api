const _ = require('lodash');
const { User, Wobj } = require('models');

module.exports = async (value) => {
  const { wobjects, error } = await User.getObjectsFollow(value);
  if (error) return { error };
  if (!wobjects.length) return { wobjects };
  const { result: parents } = await Wobj.find({ author_permlink: { $in: _.compact(_.map(wobjects, 'parent')) } });

  return {
    wobjects: _.forEach(wobjects, (wobj) => {
      if (wobj.parent) wobj.parent = _.find(parents, { author_permlink: wobj.parent });
    }),
  };
};
