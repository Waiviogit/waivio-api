const _ = require('lodash');
const { Wobj } = require('models');
const { REQUIREDFIELDS_CHILD } = require('constants/wobjectsData');

// eslint-disable-next-line camelcase
module.exports = async ({ skip, limit, author_permlink }) => {
  const { wobjects, error } = await Wobj.getChildWobjects({ skip, limit, author_permlink });

  if (error) return { error };
  wobjects.forEach((wobject) => {
    wobject.fields = _.filter(wobject.fields, (f) => REQUIREDFIELDS_CHILD.includes(f.name));
  });
  return { wobjects };
};
