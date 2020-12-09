const { HiddenComment } = require('database').models;

exports.getHiddenComments = async (...userNames) => {
  try {
    return { hiddenComments: await HiddenComment.find({ userName: { $in: userNames } }).select(['-_id', '-userName']).lean() };
  } catch (error) {
    return { error };
  }
};

exports.create = async (data) => {
  const comment = new HiddenComment(data);

  try {
    return { comment: await comment.save() };
  } catch (error) {
    return { error };
  }
};
