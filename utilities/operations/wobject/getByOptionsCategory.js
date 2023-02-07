const { Wobj } = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const _ = require('lodash');

module.exports = async ({
  authorPermlink, category, skip, limit, locale, app,
}) => {
  const emptyResp = { wobjects: [], hasMore: false };
  const { result, error } = await Wobj.findOne(
    { author_permlink: authorPermlink },
  );
  if (error) return { error };
  const processed = await wObjectHelper.processWobjects({
    wobjects: [result],
    fields: [FIELDS_NAMES.OPTIONS, FIELDS_NAMES.GROUP_ID],
    app,
    locale,
    returnArray: false,
  });

  const optionsCategory = _.get(processed, `options.${category}`);
  if (_.isEmpty(optionsCategory)) return emptyResp;
  const uniqLinks = _.chain(optionsCategory)
    .uniqBy('author_permlink')
    .uniqBy('body.value')
    .map('author_permlink')
    .value();

  const { result: wobjects, error: wobjError } = await Wobj.find(
    { author_permlink: { $in: uniqLinks } },
    { search: 0 },
    {},
    skip,
    limit + 1,
  );
  if (wobjError) return { error: wobjError };
  return {
    wobjects: _.take(wobjects, limit),
    hasMore: wobjects.length > limit,
  };
};
