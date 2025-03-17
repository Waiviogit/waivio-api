const { Wobj } = require('../../../models');
const { FIELDS_NAMES } = require('../../../constants/wobjectsData');

const getListItemLocales = async ({ authorPermlink, itemLink }) => {
  const { wObject } = await Wobj.getOne(authorPermlink);

  if (!wObject) {
    return [];
  }

  return (wObject?.fields ?? [])
    .filter((el) => el.name === FIELDS_NAMES.LIST_ITEM && el.body === itemLink)
    .map((el) => el.locale)
    .filter((el, index, self) => index === self.indexOf(el));
};

module.exports = getListItemLocales;
