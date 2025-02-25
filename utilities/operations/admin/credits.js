const { websitePayments } = require('models');
const { PAYMENT_TYPES } = require('constants/sitesConstants');

const createCreditsUser = async ({ userName, amount, admin }) => {
  const { result, error } = await websitePayments.create({
    userName,
    amount,
    type: PAYMENT_TYPES.CREDIT,
    description: `credits by ${admin}`,
  });
  if (error) return { error };
  return { result };
};

module.exports = {
  createCreditsUser,
};
