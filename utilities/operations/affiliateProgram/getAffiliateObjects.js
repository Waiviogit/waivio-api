const { Wobj } = require('../../../models');
const {
  OBJECT_TYPES,
  REMOVE_OBJ_STATUSES,
  FIELDS_NAMES,
  AFFILIATE_FIELDS,
} = require('../../../constants/wobjectsData');
const wObjectHelper = require('../../helpers/wObjectHelper');

const getAffiliateObjects = async ({ userName, app, host = '' }) => {
  const regexHost = `\\["${host.replace(/\./g, '\\.')}`;

  const regexUser = '\\["PERSONAL';
  const regex = host ? regexHost : regexUser;

  const { result: hasUserCode } = await Wobj.findObjects({
    filter: {
      object_type: OBJECT_TYPES.AFFILIATE,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.AFFILIATE_CODE,
          body: { $regex: regex },
          creator: userName,
        },
      },
    },
  });

  const hasUserCodePermlinks = hasUserCode.map((el) => el.author_permlink);
  hasUserCode.forEach((el) => {
    el.userCode = true;
    if (el?.authority?.ownership) el.authority.ownership = [];
    el.fields = el.fields.filter((f) => {
      if (f.name !== FIELDS_NAMES.AFFILIATE_CODE) return true;
      const hostCondition = host
        ? f.body.includes(host)
        : f.body.includes('PERSONAL');

      return f.creator === userName && hostCondition;
    });
    el.affiliateCodeFields = el.fields.filter((f) => f.creator === userName);
  });

  const { result: noUserCode } = await Wobj.findObjects({
    filter: {
      object_type: OBJECT_TYPES.AFFILIATE,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      'authority.ownership': { $in: app.authority },
      ...(hasUserCodePermlinks.length && { author_permlink: { $nin: hasUserCodePermlinks } }),
    },
  });

  noUserCode.forEach((el) => {
    el.fields = el.fields.filter((f) => f.name !== FIELDS_NAMES.AFFILIATE_CODE);
  });

  const wobjects = [...hasUserCode, ...noUserCode];
  // if we do need fields add hiveData true

  const processed = await wObjectHelper.processWobjects({
    wobjects,
    app,
    fields: [...AFFILIATE_FIELDS, FIELDS_NAMES.AVATAR, FIELDS_NAMES.NAME],
  });

  for (const processedElement of processed) {
    const { affiliateCode } = processedElement;

    const field = processedElement?.affiliateCodeFields?.find((el) => el.body === affiliateCode);

    processedElement.sortRange = new Date(field?._id?.getTimestamp() ?? 1).valueOf();
  }
  processed.sort((a, b) => a.sortRange - b.sortRange);

  return {
    result: processed,
  };
};

module.exports = {
  getAffiliateObjects,
};
