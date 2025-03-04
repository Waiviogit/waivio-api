/* eslint-disable camelcase */
const {
  Wobj,
  Post,
} = require('../../../models');
const { FIELDS_NAMES } = require('../../../constants/wobjectsData');
const wObjectHelper = require('../../helpers/wObjectHelper');
const _ = require('lodash');

const getWobjectPinnedPosts = async ({
  follower,
  author_permlink,
  locale,
  app,
}) => {
  const {
    wObject,
    error: wobjError,
  } = await Wobj.getOne(author_permlink);
  if (wobjError) return { error: wobjError };

  const processedObj = await wObjectHelper.processWobjects({
    wobjects: [_.cloneDeep(wObject)],
    locale,
    fields: [FIELDS_NAMES.PIN, FIELDS_NAMES.REMOVE],
    returnArray: false,
    app,
  });

  const pinnedLinksCurrentUser = wObjectHelper
    .getCurrentUserPins({ object: wObject, userName: follower });
  const filter = wObjectHelper.getPinFilter(processedObj, pinnedLinksCurrentUser);

  if (!filter.length) return { posts: [] };

  const { posts } = await Post.getManyPosts(filter);

  for (const post of posts) {
    post.currentUserPin = pinnedLinksCurrentUser.includes(`${post.author}/${post.permlink}`);
    const field = _.find(
      (processedObj?.pin ?? []),
      (f) => f.body === `${post.author}/${post.permlink}`,
    );

    post.sortingWeight = (field?.weightWAIV ?? 0) + (field?.weight ?? 0);
  }

  const sortedPosts = _.orderBy(posts, ['currentUserPin', 'sortingWeight'], ['desc', 'desc']);

  return { posts: sortedPosts };
};

module.exports = getWobjectPinnedPosts;
