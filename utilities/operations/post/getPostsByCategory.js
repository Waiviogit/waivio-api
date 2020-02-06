const { DAYS_FOR_HOT_FEED, DAYS_FOR_TRENDING_FEED, MEDIAN_USER_WAIVIO_RATE } = require('utilities/constants');
const { ObjectId } = require('mongoose').Types;
const { Post } = require('database').models;
const _ = require('lodash');

const objectIdFromDaysBefore = (daysCount) => {
  const startDate = new Date();

  startDate.setDate(startDate.getDate() - daysCount);
  startDate.setMilliseconds(0);
  startDate.setSeconds(0);
  startDate.setMinutes(0);
  startDate.setHours(0);
  const str = `${Math.floor(startDate.getTime() / 1000).toString(16)}0000000000000000`;

  return new ObjectId(str);
};

// eslint-disable-next-line camelcase
const makeConditions = ({ category, user_languages }) => {
  let cond = {};
  let sort = {};

  switch (category) {
    case 'created':
      cond = { reblog_to: null };
      sort = { _id: -1 };
      break;
    case 'hot':
      cond = {
        _id: { $gte: objectIdFromDaysBefore(DAYS_FOR_HOT_FEED) },
        reblog_to: null,
      };
      sort = { children: -1 };
      break;
    case 'trending':
      cond = {
        author_weight: { $gte: MEDIAN_USER_WAIVIO_RATE },
        _id: { $gte: objectIdFromDaysBefore(DAYS_FOR_TRENDING_FEED) },
        reblog_to: null,
      };
      sort = { net_rshares: -1 };
      break;
  }
  if (!_.isEmpty(user_languages)) cond.language = { $in: user_languages };
  return { cond, sort };
};

module.exports = async ({
  // eslint-disable-next-line camelcase
  category, skip, limit, user_languages,
}) => {
  const { cond, sort } = makeConditions({ category, user_languages });
  let posts = [];

  try {
    posts = await Post
      .find(cond)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: 'fullObjects', select: '-latest_posts' })
      .lean();
  } catch (error) {
    return { error };
  }
  return { posts };
};
