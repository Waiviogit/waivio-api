const { Post } = require('../../../models');

module.exports = async (postsRefs) => Post.getManyPosts(postsRefs);
