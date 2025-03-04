const _ = require('lodash');
const objectBotRequests = require('../../requests/objectBotRequests');
const { PAYMENT_TYPES, POSITIVE_SUM_TYPES } = require('../../../constants/sitesConstants');
const { OBJECT_BOT } = require('../../../constants/requestData');
const { sitesHelper } = require('../../helpers');

/** Method for validate and create user site */
exports.createApp = async (params) => {
  const { error, parent } = await sitesHelper.availableCheck(params);
  if (error) return { error };
  const { balance, error: checkBalanceError } = await checkOwnerBalance(params.owner);
  if (checkBalanceError) return { error: checkBalanceError };
  if (balance < 0) return { error: { status: 402, message: 'Before creating a website, make sure that you have a positive balance.' } };
  const advanced = !!params.host;
  if (advanced) {
    const { result, error: nsError } = await sitesHelper.checkNs({ host: params.host });
    if (nsError) return { error: nsError };
  }

  params.host = advanced ? params.host : `${params.name}.${parent.host}`;
  params.parentHost = parent.host;
  params.advanced = advanced;
  if (advanced) params.name = params.host;

  const { result, error: createError } = await objectBotRequests.sendCustomJson(
    params,
    `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.CREATE_WEBSITE}`,
  );
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

  const balance = sitesHelper.getSumByPaymentType(payments, POSITIVE_SUM_TYPES)
    .minus(sitesHelper.getSumByPaymentType(payments, [PAYMENT_TYPES.WRITE_OFF]))
    .toNumber();

  return { balance };
};
