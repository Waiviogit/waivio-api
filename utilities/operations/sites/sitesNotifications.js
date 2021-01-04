const _ = require('lodash');
const moment = require('moment');
const { App } = require('models');
const { redisSetter } = require('utilities/redis');
const { NOTIFICATION } = require('constants/sitesConstants');
const { getManagePage } = require('utilities/operations/sites/manage');
const notificationsHelper = require('utilities/helpers/notificationsHelper');

exports.balanceNotification = async () => {
  const { result } = await App.find({ inherited: true, canBeExtended: false });
  const owners = _.uniq(_.map(result, 'owner'));
  if (_.isEmpty(owners)) return;
  const threeMonth = Math.ceil(moment.duration(moment().add(3, 'month').startOf('day').diff(moment().startOf('day'))).asDays());
  const twoMonth = Math.ceil(moment.duration(moment().add(2, 'month').startOf('day').diff(moment().startOf('day'))).asDays());
  const oneMonth = Math.ceil(moment.duration(moment().add(1, 'month').startOf('day').diff(moment().startOf('day'))).asDays());
  const week = 7;
  const requestData = [];

  for (const owner of owners) {
    const { accountBalance, error } = await getManagePage({ userName: owner });
    if (error) continue;
    const remainingDays = _.get(accountBalance, 'remainingDays', 0);
    const paid = _.get(accountBalance, 'paid');
    if (paid < 0) {
      const suspendedDays = await redisSetter
        .incrementWebsitesSuspended({ key: owner, expire: 3600 * 25 });
      if (suspendedDays < 8) {
        requestData.push({ owner, message: NOTIFICATION.ATTENTION });
        continue;
      }
    }
    if (_.includes(_.range(1, 6), remainingDays)) {
      requestData.push({ owner, message: `${NOTIFICATION.WARNING} ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}` });
      continue;
    }
    switch (remainingDays) {
      case threeMonth:
        requestData.push({ owner, message: `${NOTIFICATION.WARNING} 3 month` });
        continue;
      case twoMonth:
        requestData.push({ owner, message: `${NOTIFICATION.WARNING} 2 month` });
        continue;
      case oneMonth:
        requestData.push({ owner, message: `${NOTIFICATION.WARNING} 1 month` });
        continue;
      case week * 3:
        requestData.push({ owner, message: `${NOTIFICATION.WARNING} 3 weeks` });
        continue;
      case week * 2:
        requestData.push({ owner, message: `${NOTIFICATION.WARNING} 2 weeks` });
        continue;
      case week:
        requestData.push({ owner, message: `${NOTIFICATION.WARNING} a week` });
        continue;
    }
  }
  if (_.isEmpty(requestData)) return;
  return notificationsHelper.sendNotification({ id: NOTIFICATION.BALANCE_ID, data: requestData });
};
