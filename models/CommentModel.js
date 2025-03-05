const { Comment } = require('../database').models;

exports.getOne = async ({ author, permlink, userId }) => {
  try {
    const cond = author ? { author, permlink } : { userId, permlink };

    return { comment: await Comment.findOne({ ...cond }).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findByCond = async (cond) => {
  try {
    return { result: await Comment.find({ ...cond }).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getMany = async ({ cond, skip, limit }) => {
  try {
    return {
      comments: await Comment.find({ ...cond })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};
