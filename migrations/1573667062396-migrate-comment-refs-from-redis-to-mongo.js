
const { restore } = require('utilities/helpers/restoreCommenRefsHelper');

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const {
    fieldsCount, wobjectsCount, postsCount, objectTypesCount,
  } = await restore();

  console.log('Restore Comments Refs to separate collection finish!');
  console.log(`Restored: types - ${objectTypesCount}, wobjects - ${wobjectsCount}, fields - ${fieldsCount}, posts - ${postsCount}`);
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down(done) {
  done();
};
