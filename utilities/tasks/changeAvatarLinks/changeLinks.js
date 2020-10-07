const _ = require('lodash');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const { WObject } = require('database').models;
const { base64ByUrl, generateFileName } = require('utilities/helpers/imagesHelper');

module.exports = async ({ AWS_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY }) => {
  const wobjects = await WObject.aggregate([
    { $match: { $or: [{ 'fields.name': 'avatar' }, { 'fields.name': 'background' }, { 'fields.name': 'galleryItem' }] } },
    { $unwind: '$fields' },
    { $match: { 'fields.body': { $regex: /^http:/ } } },
    { $project: { fields: 1, author_permlink: 1 } },
  ]);
  const image = new Image({ AWS_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY });
  const fields = _.map(wobjects, (el) => ({
    ...el.fields,
    author_permlink: el.author_permlink,
  }));
  for (const field of fields) {
    const base64 = await base64ByUrl(field.body);
    const fileName = await generateFileName({});
    const { imageUrl } = await image.uploadInS3(base64, fileName);
    await WObject.updateOne(
      { author_permlink: field.author_permlink, 'fields._id': field._id },
      { $set: { 'fields.$.body': imageUrl } },
    );
  }
};

class Image {
  constructor({ AWS_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY }) {
    const spacesEndpoint = new AWS.Endpoint(AWS_ENDPOINT);

    this._s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      params: {
        Bucket: 'waivio',
        ACL: 'public-read',
        ContentType: 'image/webp',
        ContentEncoding: 'base64',
      },
    });
  }

  async uploadInS3(base64, fileName, size = '') {
    if (base64) {
      try {
        // eslint-disable-next-line no-buffer-constructor
        const buffer = new Buffer(base64, 'base64');
        const body = await this.resizeImage({ buffer, size });

        return new Promise((resolve) => {
          this._s3.upload({ Body: body, Key: `${fileName}${size}` }, (err, data) => {
            if (err) {
              resolve({ error: `Error upload image:${err}` });
            } if (data) {
              resolve({ imageUrl: data.Location });
            }
          });
        });
      } catch (error) {
        return { error };
      }
    }
    return { error: 'Error parse image' };
  }

  // eslint-disable-next-line class-methods-use-this
  async resizeImage({ buffer, size }) {
    if (size === '_small') {
      return sharp(buffer).rotate(0).resize(34, 34).toBuffer();
    } if (size === '_medium') {
      return sharp(buffer).rotate(0).resize(180, 180).toBuffer();
    }
    if (buffer.byteLength > 1500000) {
      return sharp(buffer).resize(1980).withMetadata().toFormat('jpeg')
        .toBuffer();
    }
    return buffer;
  }
}
