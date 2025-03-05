const { UserDraft } = require('../database').models;

exports.createOrUpdate = async ({
  author, draftId, updateData,
}) => {
  try {
    const result = await UserDraft.findOneAndUpdate(
      { author, draftId },
      updateData,
      { upsert: true, returnDocument: 'after', projection: { _id: 0 } },
    );
    return { result };
  } catch (error) {
    return { error };
  }
};

exports.getOne = async ({ author, draftId }) => {
  try {
    return { result: await UserDraft.findOne({ draftId, author }) };
  } catch (error) {
    return { error };
  }
};

exports.deleteOne = async ({ author, draftId }) => {
  try {
    return { result: await UserDraft.deleteOne({ draftId, author }) };
  } catch (error) {
    return { error };
  }
};

exports.deleteMany = async ({ author, ids }) => {
  try {
    return { result: await UserDraft.deleteMany({ draftId: { $in: ids }, author }) };
  } catch (error) {
    return { error };
  }
};

exports.find = async ({ filter, projection, options }) => {
  try {
    return { result: await UserDraft.find(filter, projection, options) };
  } catch (error) {
    return { error };
  }
};
