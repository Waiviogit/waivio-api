
const { updateTopExperts } = require('utilities/operations/objectType');
const { ObjectType } = require('database').models;

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  await updateTopExperts();
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await ObjectType.updateMany({}, { $unset: { top_experts: '' } });
  done();
};
