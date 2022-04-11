const {
  ERROR_MESSAGE, AWSS3_IMAGE_PARAMS, IMAGE_SIZE,
} = require('constants/common');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const zlib = require('zlib');
const _ = require('lodash');

class Image {
  constructor() {
    const spacesEndpoint = new AWS.Endpoint(process.env.AWS_ENDPOINT);

    this._s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      params: AWSS3_IMAGE_PARAMS,
    });
  }

  async uploadInS3(base64, fileName, size = '') {
    if (base64) {
      try {
        // eslint-disable-next-line no-buffer-constructor
        const buffer = new Buffer(base64, 'base64');
        const body = await this.resizeImage({ buffer, size });
        const gzip = await gzipPromised(body);

        return new Promise((resolve) => {
          this._s3.upload({ ContentEncoding: 'gzip', Body: gzip, Key: `${fileName}${size}` }, (err, data) => {
            if (err) {
              if (err.statusCode === 503) resolve({ error: ERROR_MESSAGE.UNAVAILABLE });
              resolve({ error: `${ERROR_MESSAGE.UPLOAD_IMAGE}:${err}` });
            } if (data) {
              resolve({ imageUrl: data.Location });
            }
          });
        });
      } catch (error) {
        return { error };
      }
    }
    return { error: ERROR_MESSAGE.PARSE_IMAGE };
  }

  // eslint-disable-next-line class-methods-use-this
  async resizeImage({ buffer, size }) {
    if (size === IMAGE_SIZE.SMALL) {
      return sharp(buffer).rotate(0).resize(34, 34).toBuffer();
    } if (size === IMAGE_SIZE.MEDIUM) {
      return sharp(buffer).rotate(0).resize(180, 180).toBuffer();
    }
    if (buffer.byteLength > 1500000) {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      const format = _.get(metadata, 'format', 'webp');
      return sharp(buffer).resize(1980).withMetadata().toFormat(format)
        .toBuffer();
    }
    return buffer;
  }
}

const gzipPromised = (body) => new Promise(((resolve, reject) => {
  zlib.gzip(body, (err, res) => {
    if (err) return reject(err);
    return resolve(res);
  });
}));

const image = new Image();

module.exports = image;
