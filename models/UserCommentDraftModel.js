const { UserCommentDraft } = require('../database').models;

exports.createOrUpdate = async ({
  user, author, permlink, body,
}) => {
  try {
    const result = await UserCommentDraft.findOneAndUpdate(
      { user, author, permlink },
      { body },
      { upsert: true, returnDocument: 'after', projection: { _id: 0 } },
    );
    return { result };
  } catch (error) {
    return { error };
  }
};

exports.getOne = async ({ user, author, permlink }) => {
  try {
    return { result: await UserCommentDraft.findOne({ user, author, permlink }, { _id: 0 }) };
  } catch (error) {
    return { error };
  }
};
