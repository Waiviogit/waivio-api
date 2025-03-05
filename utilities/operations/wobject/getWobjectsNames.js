const _ = require('lodash');
const { Wobj } = require('../../../models');
const { wObjectHelper } = require('../../helpers');
const { FIELDS_NAMES, DEFAULT_LINK_FIELDS } = require('../../../constants/wobjectsData');

module.exports = async ({ links, app, locale }) => {
  const { result, error } = await Wobj.findObjects({ filter: { author_permlink: { $in: links } } });
  if (error) return { error };
  const processedObjects = await wObjectHelper.processWobjects({
    wobjects: result,
    fields: [FIELDS_NAMES.NAME, FIELDS_NAMES.AVATAR, ...DEFAULT_LINK_FIELDS],
    app,
    returnArray: true,
    locale,
  });

  return {
    wobjects: _.map(
      processedObjects,
      (o) => ({
        name: o.name,
        author_permlink: o.author_permlink,
        avatar: o.avatar,
        defaultShowLink: o.defaultShowLink,
        default_name: o.default_name,
      }),
    ),
  };
};
