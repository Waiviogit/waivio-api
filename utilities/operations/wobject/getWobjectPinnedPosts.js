/* eslint-disable camelcase */
const {
  Wobj,
  Post,
} = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');

const _ = require('lodash');

const getPinFilter = (processedObj, pinnedLinksCurrentUser) => {
  const filteredPinBody = processedObj.pin
    .filter((el) => !(processedObj?.remove ?? []).includes(el.body))
    .map((el) => el.body);

  const othersPin = processedObj.pin
    .filter((el) => filteredPinBody.includes(el.body) && !pinnedLinksCurrentUser.includes(el.body))
    .sort(wObjectHelper.arrayFieldsSpecialSort)
    .slice(0, 5)
    .map((el) => el.body);

  const resultLinks = [...pinnedLinksCurrentUser, ...othersPin];

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

  const pinnedLinksCurrentUser = _
    .chain(wObject.fields)
    .filter((f) => f.name === FIELDS_NAMES.PIN && f.creator === follower)
    .map((el) => el.body)
    .value();

  const processedObj = await wObjectHelper.processWobjects({
    wobjects: [_.cloneDeep(wObject)],
    locale,
    fields: [FIELDS_NAMES.PIN, FIELDS_NAMES.REMOVE],
    returnArray: false,
    app,
  });

  const { posts } = await Post.getManyPosts(getPinFilter(processedObj, pinnedLinksCurrentUser));

  posts.forEach((p) => {
    p.currentUserPin = pinnedLinksCurrentUser.includes(`${p.author}/${p.permlink}`);
  });
  posts.sort((a, b) => b.currentUserPin - a.currentUserPin);

  return { posts };
};

module.exports = getWobjectPinnedPosts;
