const objectBotRequests = require('utilities/requests/objectBotRequests');
const { PAYMENT_TYPES } = require('constants/sitesConstants');
const { OBJECT_BOT } = require('constants/requestData');
const { sitesHelper } = require('utilities/helpers');
const _ = require('lodash');

/** Method for validate and create user site */
exports.createApp = async (params) => {
  const { error, parent } = await sitesHelper.availableCheck(params);
  if (error) return { error };
  const { balance, error: checkBalanceError } = await checkOwnerBalance(params.owner);
  if (checkBalanceError) return { error: checkBalanceError };
  if (balance < 0) return { error: { status: 402, message: 'Before creating a website, make sure that you have a positive balance.' } };

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

const checkOwnerBalance = async (owner) => {
  const { error, payments } = await sitesHelper.getWebsitePayments({ owner });
  if (error) return { error };

  const balance = sitesHelper.getSumByPaymentType(payments, PAYMENT_TYPES.TRANSFER)
    .minus(sitesHelper.getSumByPaymentType(payments, PAYMENT_TYPES.WRITE_OFF))
    .toNumber();

  return { balance };
};
