const _ = require('lodash');
const { App } = require('models');
const { redisSetter } = require('utilities/redis');
const { NOTIFICATION } = require('constants/sitesConstants');
const manage = require('utilities/operations/sites/manage');
const notificationsHelper = require('utilities/helpers/notificationsHelper');

exports.balanceNotification = async () => {
  const { result } = await App.find({ inherited: true, canBeExtended: false });
  const owners = _.uniq(_.map(result, 'owner'));
  if (_.isEmpty(owners)) return;
  const requestData = [];

  for (const owner of owners) {
    const { accountBalance, error } = await manage.getManagePage({ userName: owner });
    if (error) continue;
    const remainingDays = _.get(accountBalance, 'remainingDays', 0);
    const paid = _.get(accountBalance, 'paid');
    const message = await getMessage({ remainingDays, paid, owner });
    if (message) requestData.push({ owner, message });
  }

  if (_.isEmpty(requestData)) return;
  return notificationsHelper.sendNotification({ id: NOTIFICATION.BALANCE_ID, data: requestData });
};

const getMessage = async ({ remainingDays, paid, owner }) => {
  if (paid < 0) {
    const suspendedDays = await redisSetter
      .incrementWebsitesSuspended({ key: owner, expire: 3600 * 25 });
    if (suspendedDays < 8) return NOTIFICATION.ATTENTION;
    return '';
  }
  const messages = {
    90: () => `${NOTIFICATION.WARNING}.90`,
    60: () => `${NOTIFICATION.WARNING}.60`,
    30: () => `${NOTIFICATION.WARNING}.30`,
    21: () => `${NOTIFICATION.WARNING}.21`,
    14: () => `${NOTIFICATION.WARNING}.14`,
    7: () => `${NOTIFICATION.WARNING}.7`,
    6: () => `${NOTIFICATION.WARNING}.6`,
    5: () => `${NOTIFICATION.WARNING}.5`,
    4: () => `${NOTIFICATION.WARNING}.4`,
    3: () => `${NOTIFICATION.WARNING}.3`,
    2: () => `${NOTIFICATION.WARNING}.2`,
    1: () => `${NOTIFICATION.WARNING}.1`,
    default: () => '',
  };
  return (messages[remainingDays] || messages.default)();
};
