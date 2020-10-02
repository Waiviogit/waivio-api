const { PAYMENT_TYPES } = require('constants/sitesConstants');
const { WebsitePayments, faker } = require('test/testHelper');

const Create = async ({
  name, type, countUsers, host, amount,
} = {}) => {
  const paymentData = {
    userName: name || faker.name.firstName(),
    type: type || PAYMENT_TYPES.TRANSFER,
    amount: amount || 1,
    host: host || faker.random.string(),
    countUsers: countUsers || 100,
    blockNum: faker.random.number(),
  };
  const payment = new WebsitePayments(paymentData);
  await payment.save();

  return payment.toObject();
};

module.exports = { Create };
