const _ = require('lodash');
const { Post, Wobj, User } = require('models');
const { appHelper, wObjectHelper } = require('utilities/helpers');
const { FIELDS_NAMES } = require('constants/wobjectsData');

module.exports = async ({
  author, permlink, userName, social,
}) => {
  const { post, error: postError } = await Post.getOne({ author, permlink });
  if (!post || postError) return { error: postError || { status: 404, message: 'Post not found' } };
  const { userSocial } = await getUserSocials(userName, social);
  const { tags, cities, wobjectsSocial } = await getWobjectInfo(post, social);

  return {
    result: {
      userSocial, tags, cities, wobjectsSocial,
    },
  };
};

const getWobjectInfo = async (post, social) => {
  let json;
  const cities = [];
  const wobjectsSocial = [];
  const pathToSocial = social === 'facebook' ? 'linkFacebook' : 'linkTwitter';
  const app = await appHelper.getApp();
  const { result } = await Wobj.find({
    author_permlink: { $in: _.map(_.get(post, 'wobjects', []), 'author_permlink') },
  });
  if (_.isEmpty(result)) return { tags: [], cities, wobjectsSocial };
  const wobjects = await wObjectHelper.processWobjects({
    wobjects: result, app, fields: [FIELDS_NAMES.ADDRESS, FIELDS_NAMES.NAME, FIELDS_NAMES.LINK],
  });

  const tags = addTags(wobjects);
  for (const wobject of wobjects) {
    if (_.has(wobject, 'link')) {
      json = parseJson(wobject.link);
      _.get(json, pathToSocial) ? wobjectsSocial.push(json[pathToSocial]) : null;
    }
    if (_.has(wobject, 'address')) {
      json = parseJson(wobject.address);
      _.get(json, 'city') ? cities.push(json.city) : null;
    }
  }
  return { tags, cities, wobjectsSocial };
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

const getUserSocials = async (userName, social) => {
  const { user } = await User.getOne(userName);
  const json = parseJson(_.get(user, 'posting_json_metadata'));
  return { userSocial: _.get(json, `profile.${social}`, '') };
};

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) { return {}; }
};
