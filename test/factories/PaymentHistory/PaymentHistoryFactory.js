const { faker, moment, PaymentHistory } = require('test/testHelper');
const UserFactory = require('test/factories/UsersFactory/UsersFactory');

const Create = async (data = {}) => {
  const paymentHistoryData = {
    payed: data.payed || false,
    userName: data.userName || `${faker.name.firstName()}${faker.random.number()}`,
    sponsor: data.sponsor || `${faker.name.firstName()}${faker.random.number()}`,
    type: data.type || 'review',
    app: data.app,
    amount: data.amount || 5,
    recounted: data.recounted || false,
    details: {
      main_object: data.main_object || faker.random.string(),
      review_object: data.review_object || faker.random.string(),
      reservation_permlink: data.permlink || faker.random.string(),
      review_permlink: data.reviewPermlink || faker.random.string(),
      votesAmount: data.votesAmount || 0,
    },
    createdAt: data.createdAt || moment.utc().format(),
  };
  if (data.remaining) paymentHistoryData.details.remaining = data.remaining;
  paymentHistoryData.details.beneficiaries = data.beneficiaries || [];
  paymentHistoryData.details.hiveCurrency = 0.5;
  const paymentHistory = new PaymentHistory(paymentHistoryData);
  try {
    await UserFactory.Create({ name: paymentHistoryData.userName });
    // eslint-disable-next-line no-empty
  } catch (e) {}

  await paymentHistory.save();
  return paymentHistory.toObject();
};

module.exports = { Create };
