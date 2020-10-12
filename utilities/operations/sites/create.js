const _ = require('lodash');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { OBJECT_BOT } = require('constants/requestData');
const { sitesHelper } = require('utilities/helpers');

/** Method for validate and create user site */
exports.createApp = async (params) => {
  const { error, parent } = await sitesHelper.availableCheck(params);
  if (error) return { error };
  params.host = `${params.name}.${parent.host}`;
  params.parentHost = parent.host;
  const { result, error: createError } = await objectBotRequests.sendCustomJson(params,
    `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.CREATE_WEBSITE}`);
  if (createError) {
    return {
      error: { status: _.get(createError, 'response.status'), message: _.get(createError, 'response.statusText', 'Forbidden') },
    };
  }
  return { result };
};
