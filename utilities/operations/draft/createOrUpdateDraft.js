const { Draft, Wobj } = require('models');
const { OBJECT_TYPES } = require('../../../constants/wobjectsData');

exports.createOrUpdateDraft = async ({
  author, permlink, body,
}) => {
  const { wObject, error: dbError } = await Wobj.getOne(permlink, OBJECT_TYPES.PAGE);
  if (dbError) return { error: dbError };

  if (!wObject) return { error: { status: 404, message: 'Wobject of type page not found' } };

  const { draft, error } = await Draft.createOrUpdate({ author, permlink, body });
  if (error) return { error };

  return { draft };
};
