const _ = require('lodash');
const { App } = require('../../../models');
const { redisSetter } = require('../../redis');
const { NOTIFICATION } = require('../../../constants/sitesConstants');
const manage = require('./manage');
const notificationsHelper = require('../../helpers/notificationsHelper');

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
    if (suspendedDays < 8) return NOTIFICATION.SUSPENDED;
    return '';
  }

  const messages = {
    90: () => NOTIFICATION.OUT_THREE_MONTHS,
    60: () => NOTIFICATION.OUT_TWO_MONTHS,
    30: () => NOTIFICATION.OUT_MONTH,
    21: () => NOTIFICATION.OUT_THREE_WEEKS,
    14: () => NOTIFICATION.OUT_TWO_WEEKS,
    7: () => NOTIFICATION.OUT_WEEK,
    6: () => NOTIFICATION.OUT_SIX_DAYS,
    5: () => NOTIFICATION.OUT_FIVE_DAYS,
    4: () => NOTIFICATION.OUT_FOUR_DAYS,
    3: () => NOTIFICATION.OUT_THREE_DAYS,
    2: () => NOTIFICATION.OUT_TWO_DAYS,
    1: () => NOTIFICATION.OUT_DAY,
    default: () => '',
  };
  return (messages[remainingDays] || messages.default)();
};
