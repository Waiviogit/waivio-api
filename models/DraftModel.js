const DraftModel = require('database').models.Draft;

exports.createOrUpdate = async ({ author, permlink, body }) => {
  try {
    const draft = await DraftModel.findOneAndUpdate({ author, permlink }, { body },
      { upsert: true, returnDocument: 'after', projection: { _id: 0 } });
    return { draft };
  } catch (error) {
    return { error };
  }
};

exports.getOne = async (author, permlink) => {
  try {
    return { draft: await DraftModel.findOne({ author, permlink }, { _id: 0 }) };
  } catch (error) {
    return { error };
  }
};
