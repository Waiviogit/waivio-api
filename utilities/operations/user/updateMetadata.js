/* eslint-disable camelcase */
const _ = require('lodash');
const { User } = require('../../../models');

module.exports = async ({ user_name, user_metadata }) => {
  user_metadata.drafts = _.slice(_.orderBy(user_metadata.drafts, ['lastUpdated'], ['desc']), 0, 20);
  if (user_metadata.settings.hiveBeneficiaryAccount) {
    const { user: beneficiary } = await User.getOne(user_metadata.settings.hiveBeneficiaryAccount);
    if (beneficiary.auth) return { error: { status: 422, message: 'Guests cannot be linked' } };
  }

  const { user, error } = await User.updateOne({ name: user_name }, { $set: { user_metadata } });

  if (error) return { error };
  return { user_metadata: user.user_metadata };
};
