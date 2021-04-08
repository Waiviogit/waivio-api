/* eslint-disable camelcase */
const _ = require('lodash');
const { faker, Post } = require('test/testHelper');

const Create = async ({
  reblogged, depth, author, author_weight, totalVoteWeight, parentAuthor, additionsForMetadata = {}, onlyData,
  additionsForPost = {}, active_votes = [], app, rootAuthor, permlink, wobjects = [], children,
  pending_payout_value, curator_payout_value, cashout_time, parentPermlink, blocked,
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
    id: faker.random.number(10000),
    author: author || faker.name.firstName().toLowerCase(),
    author_weight: author_weight || 0,
    permlink: permlink || faker.random.string(20),
    parent_author: parentAuthor || '', // if it's post -> parent_author not exists
    parent_permlink: _.isNil(parentPermlink) ? faker.random.string(20) : parentPermlink,
    title: faker.address.city(),
    body: faker.lorem.sentence(),
    children: children || faker.random.number(),
    json_metadata: JSON.stringify(jsonMetadata),
    app: app || faker.random.string(10),
    depth: depth || 0,
    total_vote_weight: totalVoteWeight || 0,
    active_votes,
    wobjects,
    createdAt: faker.date.recent(10).toString(),
    created: faker.date.recent(10).toString(),
    reblogged_users: reblogged || [],
    root_author: rootAuthor || faker.name.firstName().toLowerCase(),
    blocked_for_apps: blocked || [],
    pending_payout_value,
    curator_payout_value,
    cashout_time,
  };

  for (const key in additionsForPost) {
    post[key] = additionsForPost[key];
  }
  if (onlyData) { // return only post data, but not create into database
    return post;
  }
  const newPost = await Post.create(post);
  return newPost.toObject();
};
module.exports = { Create };
