const wObjectHelper = require('utilities/helpers/wObjectHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { Wobj } = require('models');



module.exports = async ({ authorPermlink, app }) => {
  const { result } = await Wobj.findOne({ author_permlink: authorPermlink });
  if (!result) return { error: { status: 404, message: 'Not Found' } };
  const processedObject = await wObjectHelper.processWobjects({
    wobjects: [result],
    returnArray: false,
    app,
    fields: [FIELDS_NAMES.SHOP_FILTER],
  });

  if (!processedObject[FIELDS_NAMES.SHOP_FILTER]) return { error: { status: 404, message: 'Not Found' } };
  const filter = jsonHelper.parseJson(processedObject[FIELDS_NAMES.SHOP_FILTER], null);
  if(_.isEmpty(filter)) return
};
