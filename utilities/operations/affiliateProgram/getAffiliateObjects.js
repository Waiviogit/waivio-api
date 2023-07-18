const { Wobj } = require('models');
const {
  OBJECT_TYPES,
  REMOVE_OBJ_STATUSES,
  FIELDS_NAMES,
  AFFILIATE_FIELDS,
} = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');

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
      return f.creator === userName;
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
    fields: AFFILIATE_FIELDS,
  });

  return {
    result: processed,
  };
};

module.exports = {
  getAffiliateObjects,
};
