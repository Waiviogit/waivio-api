const { Wobj } = require('models');
const { OBJECT_TYPES, FIELDS_NAMES } = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');

const processUserAffiliate = async ({}) => {
  // filter fields before by creator processing

};

const processAppAffiliate = async ({ countryCode = 'US', app, locale = 'en-US' }) => {
  // wor waivio condition authority === 'waivio'
  // else owner and admins
  // country code + global + continents
  // locale exploit

  const regex = `\\["${app.host.replace(/\./g, '\\.')}`;
  // add to conditions waivio and others
  const { result, error } = await Wobj.findObjects({
    filter: {
      object_type: OBJECT_TYPES.AFFILIATE,
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.AFFILIATE_CODE,
          body: { $regex: regex },
        },
      },
    },
  });

  const processed = await wObjectHelper.processWobjects({
    wobjects: result,
    app,
    locale,
    fields: [],
  });

  console.log();
};

module.exports = {
  processAppAffiliate,
  processUserAffiliate,
};
