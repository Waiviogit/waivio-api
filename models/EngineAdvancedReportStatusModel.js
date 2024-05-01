const { EngineAdvancedReportStatus } = require('database').models;

const create = async (doc) => {
  try {
    const result = await EngineAdvancedReportStatus.create(doc);
    return { result };
  } catch (error) {
    return { error };
  }
};

const updateOne = async ({ filter, update, options }) => {
  try {
    const result = await EngineAdvancedReportStatus.updateOne(filter, update, options);
    return { result };
  } catch (error) {
    return { error };
  }
};

const findOne = async ({ filter, projection, options }) => {
  try {
    const result = await EngineAdvancedReportStatus.findOne(filter, projection, options).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

const find = async ({ filter, projection, options }) => {
  try {
    const result = await EngineAdvancedReportStatus.find(filter, projection, options).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  create,
  updateOne,
  findOne,
  find,
};
