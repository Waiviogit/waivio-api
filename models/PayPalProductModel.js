const { PayPalProduct } = require('../database').models;

const findOne = async ({ filter, projection, options }) => {
  try {
    return { result: await PayPalProduct.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const findOneByName = async (name) => findOne({ filter: { name } });
const findOneById = async (id) => findOne({ filter: { id } });

const create = async (doc) => {
  try {
    return { result: await PayPalProduct.create(doc) };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  findOneByName,
  create,
  findOneById,
};
