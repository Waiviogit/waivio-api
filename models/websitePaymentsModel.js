const { WebsitePayments } = require('database').models;

exports.find = async ({ condition, sort }) => {
  try {
    return { result: await WebsitePayments.find(condition).sort(sort).lean() };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (condition) => {
  try {
    return { result: await WebsitePayments.aggregate(condition) };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition) => {
  try {
    return { result: await WebsitePayments.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.distinct = async ({ field, query = {} }) => {
  try {
    return { result: await WebsitePayments.distinct(field, query).lean() };
  } catch (error) {
    return { error };
  }
};

exports.create = async (doc) => {
  try {
    return { result: await WebsitePayments.create(doc) };
  } catch (error) {
    return { error };
  }
};
