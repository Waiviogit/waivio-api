
const _ = require('lodash');
const { WObject } = require('database').models;

const checkValidStatusField = (field) => {
  if (field.name !== 'status') return false;
  if (typeof field.body !== 'string') return false;
  try {
    const parsed = JSON.parse(field.body);

    if (parsed.title) return true;
  } catch (e) {
    return false;
  }
};
/**
 * Make any changes you need to make to the database here
 */

exports.up = async function up(done) {
  const cursor = WObject.find({ 'fields.name': 'status' }).cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
    const wobject = doc.toObject();
    const statusField = _.chain(wobject.fields)
      .filter(checkValidStatusField)
      .orderBy(['weight'], ['desc'])
      .first()
      .value();

    if (statusField) {
      const status = JSON.parse(statusField.body);
      const res = await WObject.updateOne({ _id: doc._id }, { $set: { status } });

      if (res.nModified) {
        console.log(`Waivio Object ${doc.author_permlink} updated! Now "Object" has status ${status.title}!`);
      }
    }
  });
  done();
};
/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await WObject.update({}, { $unset: { status: '' } });
  console.log('Deleted field "status" from all of Wobjects!');
  done();
};
