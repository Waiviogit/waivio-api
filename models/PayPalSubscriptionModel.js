const { PayPalSubscription } = require('../database').models;

const findOne = async ({ filter, projection, options }) => {
  try {
    return { result: await PayPalSubscription.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const updateOne = async ({ filter, update, options }) => {
  try {
    return { result: await PayPalSubscription.updateOne(filter, update, options).lean() };
  } catch (error) {
    return { error };
  }
};

const create = async (doc) => {
  try {
    return { result: await PayPalSubscription.create(doc) };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  create,
  findOne,
  updateOne,
};
