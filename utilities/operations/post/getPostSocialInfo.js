const _ = require('lodash');
const { Post, Wobj, User } = require('models');
const { appHelper, wObjectHelper } = require('utilities/helpers');
const { FIELDS_NAMES } = require('constants/wobjectsData');

module.exports = async ({
  author, permlink, userName,
}) => {
  const { post, error: postError } = await Post.getOne({ author, permlink });
  if (!post || postError) return { error: postError || { status: 404, message: 'Post not found' } };
  const { userFacebook, userTwitter } = await getUserSocials(userName);
  const {
    tags, cities, wobjectsTwitter, wobjectsFacebook,
  } = await getWobjectInfo(post);

  return {
    result: {
      tags, cities, wobjectsTwitter, wobjectsFacebook, userFacebook, userTwitter,
    },
  };
};

const getWobjectInfo = async (post) => {
  let json;
  const cities = [];
  const wobjectsTwitter = [];
  const wobjectsFacebook = [];
  const app = await appHelper.getApp();
  const { result } = await Wobj.find({
    author_permlink: { $in: _.map(_.get(post, 'wobjects', []), 'author_permlink') },
  });
  if (_.isEmpty(result)) {
    return {
      tags: ['HIVE', 'waivio'], cities, wobjectsTwitter, wobjectsFacebook,
    };
  }
  const wobjects = await wObjectHelper.processWobjects({
    wobjects: result, app, fields: [FIELDS_NAMES.ADDRESS, FIELDS_NAMES.NAME, FIELDS_NAMES.LINK],
  });

  const tags = addTags(wobjects);
  for (const wobject of wobjects) {
    if (_.has(wobject, 'link')) {
      json = parseJson(wobject.link);
      _.get(json, 'linkFacebook') ? wobjectsFacebook.push(json.linkFacebook) : null;
      _.get(json, 'linkTwitter') ? wobjectsTwitter.push(json.linkTwitter) : null;
    }
    if (_.has(wobject, 'address')) {
      json = parseJson(wobject.address);
      _.get(json, 'city') ? cities.push(json.city) : null;
    }
  }
  return {
    tags, cities, wobjectsTwitter, wobjectsFacebook,
  };
};

const addTags = (wobjects) => {
  const tags = _.chain(wobjects)
    .filter((w) => w.object_type === 'hashtag')
    .orderBy('weight', 'desc')
    .map((w) => (w.name || w.default_name).replace(/ /g, ''))
    .slice(0, 3)
    .push('HIVE', 'waivio')
    .value();
  if (tags.length === 5) return tags;
  _.chain(wobjects)
    .filter((w) => w.object_type !== 'hashtag')
    .orderBy('weight', 'desc')
    .forEach((w) => {
      if (tags.length < 5) tags.push((w.name || w.default_name).replace(/ /g, ''));
    })
    .value();
  return tags;
};

const getUserSocials = async (userName) => {
  const { user } = await User.getOne(userName);
  const json = parseJson(_.get(user, 'posting_json_metadata'));
  return {
    userFacebook: _.get(json, 'profile.facebook', ''),
    userTwitter: _.get(json, 'profile.twitter', ''),
  };
};

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) { return {}; }
};
