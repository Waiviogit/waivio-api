const {
  UserDraftModel,
} = require('../../../models');

exports.createOrUpdateDraft = async ({
  draftId,
  title,
  author,
  beneficiary,
  isUpdating,
  upvote,
  body,
  originalBody,
  jsonMetadata,
  lastUpdated,
  parentAuthor,
  parentPermlink,
  permlink,
  reward,
}) => {
  const { result, error } = await UserDraftModel.createOrUpdate({
    author,
    draftId,
    updateData: {
      draftId,
      title,
      author,
      beneficiary,
      isUpdating,
      upvote,
      body,
      originalBody,
      jsonMetadata,
      lastUpdated,
      parentAuthor,
      parentPermlink,
      permlink,
      reward,
    },
  });
  if (error) return { error };

  return { result };
};

exports.getDraft = async ({
  author,
  draftId,
}) => {
  const { result, error } = await UserDraftModel.getOne({ author, draftId });
  if (error) return { error };

  if (!result) return { error: { status: 404, message: 'draft not found' } };

  return { result };
};

exports.getDrafts = async ({
  author,
  skip,
  limit,
}) => {
  const { result, error } = await UserDraftModel.find({
    filter: { author },
    options: {
      sort: { lastUpdated: -1 },
      skip,
      limit: limit + 1,
    },
  });
  if (error) return { error };

  if (!result) return { error: { status: 404, message: 'draft not found' } };

  return {
    result: result.slice(0, limit),
    hasMore: result.length > limit,
  };
};

exports.deleteDraft = async ({
  author,
  ids,
}) => {
  const { result, error } = await UserDraftModel.deleteMany({ author, ids });
  if (error) return { error };

  return { result };
};
