const { EngineAdvancedReport } = require('../database').models;

const insertMany = async (docs) => {
  try {
    const result = await EngineAdvancedReport.insertMany(docs);
    return { result };
  } catch (error) {
    return { error };
  }
};

const insert = async (doc) => {
  try {
    const result = await EngineAdvancedReport.create(doc);
    console.log('INSERT RESULT');
    console.log(JSON.stringify(result));
    return { result };
  } catch (error) {
    console.log(`error on save: ${error.message}`);
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

const findOneAndUpdate = async ({ filter, update, options }) => {
  try {
    const result = await EngineAdvancedReport.findOneAndUpdate(filter, update, options).lean();
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
  findOneAndUpdate,
  insert,
};
