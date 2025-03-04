const { addCampaignsToWobjects } = require('../../helpers/campaignsHelper');
const { REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');
const { Wobj, User } = require('../../../models');

module.exports = async ({
  skip, limit, authorPermlink, excludeTypes = [], searchString, userName,
}) => {
  const query = {
    parent: authorPermlink,
    object_type: { $nin: excludeTypes },
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
  };
  if (searchString) {
    const searchQuery = { $and: [{ 'fields.name': 'name' }, { 'fields.body': { $regex: searchString, $options: 'i' } }] };
    Object.assign(query, searchQuery);
  }
  const { result, error } = await Wobj.find(
    query,
    {},
    { weight: -1, _id: -1 },
    skip,
    limit,
  );

  if (error) return { error };
  if (userName) {
    const { user } = await User.getOne(userName);

    return { wobjects: await addCampaignsToWobjects({ wobjects: result, user }) };
  }
  return { wobjects: result };
};
