const { websitePayments, App } = require('../../../models');
const {
  PAYMENT_TYPES,
  STATUSES,
} = require('../../../constants/sitesConstants');
const { sitesHelper } = require('../../helpers');

const createCreditsUser = async ({
  userName,
  amount,
  admin,
}) => {
  const {
    result,
    error,
  } = await websitePayments.create({
    userName,
    amount,
    type: PAYMENT_TYPES.CREDIT,
    description: `credits by ${admin}`,
  });

  if (error) return { error };
  const { balance } = await sitesHelper.checkOwnerBalance(userName);
  const { result: suspended } = await App.findOne(
    { owner: userName, inherited: true, status: STATUSES.SUSPENDED },
    { _id: 1 },
  );

  // remove suspended status
  if (suspended && balance > 0) {
    const { result: apps = [] } = await App.find(
      { owner: userName, inherited: true },
      {},
      { activatedAt: 1, deactivatedAt: 1, _id: 1 },
    );

    for (const app of apps) {
      let status = STATUSES.PENDING;
      app.activatedAt ? status = STATUSES.ACTIVE : null;
      app.deactivatedAt ? status = STATUSES.INACTIVE : null;
      await App.updateOne({ _id: app._id }, { status });
    }
  }

  return { result };
};

module.exports = {
  createCreditsUser,
};
