const _ = require('lodash');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { WObject } = require('database').models;

module.exports = async () => {
  const wobjects = await WObject.find({
    $and: [{ status: { $exists: false } }, { 'fields.name': 'status' }],
  }).lean();
  for (const wobject of wobjects) {
    const statusField = _.find(wobject.fields, (field) => field.name === FIELDS_NAMES.STATUS);
    await WObject.updateOne({ _id: wobject._id }, { 'status.title': JSON.parse(statusField.body).title });
  }
};
