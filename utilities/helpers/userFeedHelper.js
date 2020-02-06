const { User } = require('database').models;
const Post = require('models/PostModel');
const { addAuthorWobjectsWeight } = require('utilities/helpers/postHelper');

const feedByObjects = async (data) => {
  const user = await User.findOne({ name: data.user }).lean(); // get user data from db

  if (!user) {
    return [];
  }
  data.objects = user.objects_follow;


  const { posts, error } = await Post.getFeedByObjects(data);

  if (error) {
    return { error };
  }
  await addAuthorWobjectsWeight(posts);
  return { posts };
};

module.exports = { feedByObjects };
