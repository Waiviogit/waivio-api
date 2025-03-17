const { PayPalPlan } = require('../database').models;

const findOne = async ({ filter, projection, options }) => {
  try {
    return { result: await PayPalPlan.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const findOneByProductId = async (id) => findOne({ filter: { product_id: id } });
const findOneById = async (id) => findOne({ filter: { id } });

const create = async (doc) => {
  try {
    return { result: await PayPalPlan.create(doc) };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  findOneByProductId,
  findOneById,
  create,
};
