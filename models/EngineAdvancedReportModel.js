const { EngineAdvancedReport } = require('database').models;

const insertMany = async (docs) => {
  try {
    const result = await EngineAdvancedReport.insertMany(docs);
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  insertMany,
};
