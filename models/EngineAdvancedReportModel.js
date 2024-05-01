const { EngineAdvancedReport } = require('database').models;

const insertMany = async (docs) => {
  try {
    const result = await EngineAdvancedReport.insertMany(docs);
    return { result };
  } catch (error) {
    return { error };
  }
};

const find = async ({ filter, projection, options }) => {
  try {
    const result = await EngineAdvancedReport.find(filter, projection, options).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

const updateOne = async ({ filter, update, options }) => {
  try {
    const result = await EngineAdvancedReport.updateOne(filter, update, options);
    return { result };
  } catch (error) {
    return { error };
  }
};

const findOne = async ({ filter, projection, options }) => {
  try {
    const result = await EngineAdvancedReport.findOne(filter, projection, options).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  insertMany,
  find,
  updateOne,
  findOne,
};
