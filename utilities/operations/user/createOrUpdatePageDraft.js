const { PageDraft, Wobj } = require('models');
const { OBJECT_TYPES } = require('../../../constants/wobjectsData');

exports.createOrUpdateDraft = async ({
  user, authorPermlink, body,
}) => {
  const { wObject, error: dbError } = await Wobj.getOne(authorPermlink, OBJECT_TYPES.PAGE);
  if (dbError) return { error: dbError };

  if (!wObject) return { error: { status: 404, message: 'Wobject of type page not found' } };

  const { draft, error } = await PageDraft.createOrUpdate({ user, authorPermlink, body });
  if (error) return { error };

  return { draft };
};
