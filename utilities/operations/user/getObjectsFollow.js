const _ = require('lodash');
const { User } = require('models');

module.exports = async (value) => {
  const { wobjects, error } = await User.getObjectsFollow(value);
  if (error) return { error };
  if (!wobjects.length) return { wobjects };
  wobjects.forEach((wObject) => {
    wObject.fields = _.filter(wObject.fields, (field) => _.includes(['name', 'avatar'], field.name));
  });
  return { wobjects };
};
