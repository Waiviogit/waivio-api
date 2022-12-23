const _ = require('lodash');
const { Wobj } = require('models');
const { wObjectHelper } = require('utilities/helpers');
const { FIELDS_NAMES } = require('constants/wobjectsData');

module.exports = async ({ links, app, locale }) => {
  const { result, error } = await Wobj.findObjects({ filter: { author_permlink: { $in: links } } });
  if (error) return { error };
  const processedObjects = await wObjectHelper.processWobjects({
    wobjects: result,
    fields: [FIELDS_NAMES.NAME],
    app,
    returnArray: true,
    locale,
  });

  return {
    wobjects: _.map(
      processedObjects,
      (o) => ({ name: o.name, author_permlink: o.author_permlink }),
    ),
  };
};
