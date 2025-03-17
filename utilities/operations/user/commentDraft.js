const { UserCommentDraftModel } = require('../../../models');

exports.createOrUpdateDraft = async ({
  user, author, permlink, body,
}) => {
  const { result, error } = await UserCommentDraftModel.createOrUpdate({
    user, author, permlink, body,
  });
  if (error) return { error };

  return { result };
};

exports.getDraft = async ({ user, author, permlink }) => {
  const { result, error } = await UserCommentDraftModel.getOne({ user, author, permlink });
  if (error) return { error };

  if (!result) return { error: { status: 404, message: 'Comment draft not found' } };

  return { result };
};
