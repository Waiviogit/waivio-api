const { getOne } = require('../../../models/DraftModel');

exports.getDraft = async (author, permlink) => {
  const { draft, error } = await getOne(author, permlink);
  if (error) return { error };

  if (!draft) return { error: { status: 404, message: 'Draft not found' } };

  return { draft };
};
