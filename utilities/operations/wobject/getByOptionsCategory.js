const _ = require('lodash');
const { Wobj, User } = require('../../../models');
const wObjectHelper = require('../../helpers/wObjectHelper');
const campaignsV2Helper = require('../../helpers/campaignsV2Helper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');
const { isMobileDevice } = require('../../../middlewares/context/contextHelper');

module.exports = async ({
  authorPermlink, category, skip, limit, locale, app, userName = '',
}) => {
  const emptyResp = { wobjects: [], hasMore: false };
  const { result, error } = await Wobj.findOne(
    { author_permlink: authorPermlink },
  );
  if (error) return { error };
  const processed = await wObjectHelper.processWobjects({
    wobjects: [result],
    app,
    locale,
    returnArray: false,
    mobile: isMobileDevice(),
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

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects });
  return {
    wobjects: _.take(wobjects, limit),
    hasMore: wobjects.length > limit,
  };
};
