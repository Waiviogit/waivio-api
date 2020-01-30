
const uuid = require('uuid/v4');
const image = require('utilities/images/image');
const { base64ByUrl } = require('utilities/helpers/imagesHelper');
const { WObject } = require('database').models;
/**
 * Make any changes you need to make to the database here
 */

exports.up = async function up(done) {
  try {
    const imageFields = await WObject.aggregate([
      { $unwind: { path: '$fields' } },
      { $match: { 'fields.name': 'avatar' } },
      { $project: { field: '$fields', _id: 1 } },
    ]);

    for (const imageField of imageFields) {
      const base64 = await base64ByUrl(imageField.field.body);
      const fileName = `${Math.round(new Date() / 1000)}_${uuid()}`;
      const { imageUrl, error } = await image.uploadInS3(base64, fileName);

      if (error) {
        console.log(error);
      } else if (imageUrl) {
        await image.uploadInS3(base64, fileName, '_small');
        await image.uploadInS3(base64, fileName, '_medium');
        await WObject.updateOne({
          _id: imageField._id,
          'fields._id': imageField.field._id,
        }, {
          $set: {
            'fields.$.body': imageUrl,
          },
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down(done) {
  done();
};
