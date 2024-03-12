/* eslint-disable camelcase */
const {
  Wobj,
  Post,
} = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');

const _ = require('lodash');

const getPinFilter = (processedObj, pinnedLinksCurrentUser) => {
  const filteredPinBody = (processedObj?.pin ?? [])
    .filter((el) => !(processedObj?.remove ?? []).includes(el.body))
    .map((el) => el.body);

  const processedCurrentUser = (processedObj?.pin ?? [])
    .filter((el) => pinnedLinksCurrentUser.includes(el.body));

  const othersPin = (processedObj?.pin ?? [])
    .filter((el) => filteredPinBody.includes(el.body) && !pinnedLinksCurrentUser.includes(el.body))
    .sort(wObjectHelper.arrayFieldsSpecialSort)
    .slice(0, 5)
    .map((el) => el.body);

  const resultLinks = [...processedCurrentUser, ...othersPin];

  return resultLinks.map((link) => {
    const [author, permlink] = link.split('/');
    return {
      author,
      permlink,
    };
  });
};

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

  const pinnedLinksCurrentUser = _
    .chain(wObject.fields)
    .filter((f) => f.name === FIELDS_NAMES.PIN && f.creator === follower)
    .map((el) => el.body)
    .value();

  const filter = getPinFilter(processedObj, pinnedLinksCurrentUser);

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
