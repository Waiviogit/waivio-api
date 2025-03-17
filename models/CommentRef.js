const { CommentRef } = require('../database').models;

exports.create = async (data) => {
  const newCommentRef = new CommentRef(data);

  try {
    return { commentRef: await newCommentRef.save() };
  } catch (error) {
    return { error };
  }
};

exports.getRef = async (commentPath) => {
  try {
    const commentRef = await CommentRef.findOne({ comment_path: commentPath }).lean();

    return { commentRef };
  } catch (error) {
    return { error };
  }
};
