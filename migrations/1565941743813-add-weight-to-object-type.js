
const { ObjectType, WObject } = require('database').models;
/**
 * Make any changes you need to make to the database here
 */

exports.up = async function up(done) {
  const cursor = ObjectType.find().cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
    const [{ totalWeight }] = await WObject.aggregate([
      { $match: { object_type: doc.name } },
      { $group: { _id: null, total_weight: { $sum: '$weight' } } },
    ]);
    const res = await ObjectType.updateOne({ _id: doc._id }, { $set: { weight: totalWeight } });

    if (res.nModified) {
      console.log(`ObjectType ${doc.name} updated! Now "Type" has ${totalWeight} weight!`);
    }
  });
  done();
};
/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await ObjectType.update({}, { $unset: { weight: '' } });
  console.log('Deleted field "weight" from all of ObjectTypes!');
  done();
};
