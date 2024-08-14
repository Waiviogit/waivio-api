const wObjectHelper = require('utilities/helpers/wObjectHelper');
const { Wobj, Subscriptions } = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');

const getObjectGroup = async ({
  authorPermlink, app, skip, limit,
}) => {
  const { wObject, error } = await Wobj.getOne(authorPermlink);
  if (error) return { error };
  const processed = await wObjectHelper.processWobjects({
    wobjects: [wObject],
    app,
    returnArray: false,
    fields: [
      FIELDS_NAMES.GROUP_EXCLUDE,
      FIELDS_NAMES.GROUP_ADD,
      FIELDS_NAMES.GROUP_FOLLOWERS,
      FIELDS_NAMES.GROUP_FOLLOWING,
      FIELDS_NAMES.GROUP_EXPERTISE,
    ],
  });

  
};
