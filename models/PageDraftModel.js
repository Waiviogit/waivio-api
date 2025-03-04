const PageDraftModel = require('../database').models.PageDraft;

exports.createOrUpdate = async ({ user, authorPermlink, body }) => {
  try {
    const draft = await PageDraftModel.findOneAndUpdate(
      { user, author_permlink: authorPermlink },
      { body },
      { upsert: true, returnDocument: 'after', projection: { _id: 0 } },
    );
    return { draft };
  } catch (error) {
    return { error };
  }
};

exports.getOne = async (user, authorPermlink) => {
  try {
    return { draft: await PageDraftModel.findOne({ user, author_permlink: authorPermlink }, { _id: 0 }) };
  } catch (error) {
    return { error };
  }
};
