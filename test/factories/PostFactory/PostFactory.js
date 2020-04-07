const _ = require('lodash');
const { faker, Post, commentRefSetter } = require('test/testHelper');

const Create = async ({
  children, reblogged, author, parentAuthor, additionsForMetadata = {}, onlyData, parentPermlink,
  additionsForPost = {}, active_votes = [], app, rootAuthor, permlink,
} = {}) => { // additionsForMetadata(Post) must be an Object
  const jsonMetadata = {
    community: 'waiviotest',
    app: app || 'waiviotest',
    tags: ['testtag1', 'testtag2'],
  };

  for (const key in additionsForMetadata) {
    jsonMetadata[key] = additionsForMetadata[key];
  }
  const post = {
    parent_author: parentAuthor || '', // if it's post -> parent_author not exists
    parent_permlink: _.isNil(parentPermlink) ? faker.random.string(20) : parentPermlink,
    author: author || faker.name.firstName().toLowerCase(),
    permlink: permlink || faker.random.string(20),
    title: faker.address.city(),
    body: faker.lorem.sentence(),
    children: children || faker.random.number(),
    json_metadata: JSON.stringify(jsonMetadata),
    id: faker.random.number(10000),
    active_votes,
    createdAt: faker.date.recent(10).toString(),
    created: faker.date.recent(10).toString(),
    reblogged_users: reblogged || [],
  };
  post.root_author = rootAuthor || post.author;
  post.root_permlink = post.permlink;

  for (const key in additionsForPost) {
    post[key] = additionsForPost[key];
  }
  if (onlyData) { // return only post data, but not create into database
    return post;
  }
  const newPost = await Post.create(post);
  await commentRefSetter.addPostRef(
    `${post.root_author}_${post.permlink}`,
    _.get(additionsForMetadata, 'wobj.wobjects', []),
    post.author === post.root_author ? null : post.author,
  );

  return newPost.toObject();
};
module.exports = { Create };
