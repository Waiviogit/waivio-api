const { faker, ObjectID, CampaignV2 } = require('test/testHelper');

const Create = async (data = {}) => {
  const campaignData = {
    id: data.id || undefined,
    guideName: data.guideName || `${faker.name.firstName()}${faker.random.number()}`,
    name: data.name || `${faker.name.firstName()}${faker.random.number()}`,
    status: data.status || 'pending',
    type: data.type || 'reviews',
    note: data.note || faker.lorem.words(),
    budget: data.budget || 100,
    reward: data.reward || 10.5,
    requirements: data.requirements || { minPhotos: 1 },
    userRequirements: data.userRequirements || { minFollowers: 1, minPosts: 1, minExpertise: 0 },
    requiredObject: data.requiredObject || 'req_obj1',
    objects: data.objects || ['obj1', 'obj2', 'obj3'],
    payoutToken: data.payoutToken || 'WAIV',
    payoutTokenRateUSD: data.payoutTokenRateUSD || 1,
    rewardInUSD: data.rewardInUSD || 1,
    users: data.users || [{
      name: `${faker.name.firstName()}${faker.random.number()}`,
      status: 'assigned',
      object_permlink: 'obj1',
      hiveCurrency: data.currency || 1,
      rewardRaisedBy: data.raised || 0,
      permlink: 'permlink1',
      _id: new ObjectID(),
    }],
    blacklist_users: data.blacklist_users || [],
    whitelist_users: data.whitelist_users || [],
    payments: data.payments || [],
    reservation_timetable: data.reservation_timetable || {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
    frequency_assign: data.frequency_assign || 0,
    max_assign_count: data.max_assign_count || 1,
    match_bots: data.match_bots || [],
    count_reservation_days: data.count_reservation_days || 1,
    activation_permlink: data.status && data.status !== 'pending' ? data.activation_permlink : undefined,
    deactivation_permlink: data.status && data.status !== 'pending' ? data.deactivation_permlink : undefined,
    expired_at: data.expired_at || faker.date.future(1),
    app: data.app || 'app',
    compensationAccount: data.compensationAccount || undefined,
  };

  const campaign = new CampaignV2(campaignData);

  if (!data.hasOwnProperty('coordinates')) {
    campaign.map = undefined;
  }
  if (data.hasOwnProperty('customTimestamps')) {
    // allows to save timestamps that we need
    await campaign.save({ timestamps: false });
  } else {
    await campaign.save();
  }

  // Please, dont ask....
  if (data.noObject) {
    return campaign;
  }

  return campaign.toObject();
};

module.exports = { Create };
