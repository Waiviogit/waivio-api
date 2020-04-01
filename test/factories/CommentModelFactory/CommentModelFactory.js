const { faker, Comment } = require('../../testHelper');

const Create = async ({
  author, permlink, parentAuthor, parentPermlink, rootAuthor, rootPermlink, guestInfo, activeVotes,
} = {}) => {
  const comment = {
    author: author || faker.name.firstName().toLowerCase(),
    permlink: permlink || faker.random.string(20),
    parent_author: parentAuthor || faker.name.firstName().toLowerCase(),
    parent_permlink: parentPermlink || faker.random.string(20),
    root_author: rootAuthor || faker.name.firstName().toLowerCase(),
    root_permlink: rootPermlink || faker.random.string(20),
    active_votes: activeVotes || [],
    guestInfo: guestInfo || null,
  };
  const newComment = await Comment.create(comment);
  return newComment.toObject();
};

module.exports = { Create };
