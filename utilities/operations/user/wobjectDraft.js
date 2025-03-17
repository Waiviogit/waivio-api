const { PageDraft } = require('../../../models');

exports.createOrUpdateDraft = async ({
  user, authorPermlink, body,
}) => {
  const { draft, error } = await PageDraft.createOrUpdate({ user, authorPermlink, body });
  if (error) return { error };

  return { draft };
};

exports.getDraft = async (user, authorPermlink) => {
  const { draft, error } = await PageDraft.getOne(user, authorPermlink);
  if (error) return { error };

  if (!draft) return { error: { status: 404, message: 'Page draft not found' } };

  return { draft };
};
