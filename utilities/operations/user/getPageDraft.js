const { getOne } = require('../../../models/PageDraftModel');

exports.getPageDraft = async (user, authorPermlink) => {
  const { draft, error } = await getOne(user, authorPermlink);
  if (error) return { error };

  if (!draft) return { error: { status: 404, message: 'Page draft not found' } };

  return { draft };
};
