const {
  ERROR_MESSAGE, AWSS3_IMAGE_PARAMS, IMAGE_SIZE, IMAGES_FORMAT,
} = require('constants/common');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const zlib = require('zlib');
const _ = require('lodash');
const heicConvert = require('heic-convert');

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
        const buffer = Buffer.from(base64, 'base64');
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

  getWidth(metadata) {
    const defaultWidthH = 1920;
    const defaultWidthV = 1080;
    if (!metadata?.width) return defaultWidthH;
    const { width, height } = metadata;
    const horizontal = width > height;
    if (horizontal) {
      return width > defaultWidthH ? defaultWidthH : width;
    }

    return width > defaultWidthV ? defaultWidthV : width;
  }

  async resizeImage({ buffer, size }) {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const format = metadata?.format === IMAGES_FORMAT.GIF
      ? IMAGES_FORMAT.GIF
      : IMAGES_FORMAT.WEBP;
    if (metadata?.format === 'heif') {
      buffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 1,
      });
    }

    if (size === IMAGE_SIZE.SMALL) {
      return sharp(buffer).rotate(0).resize(34, 34).toFormat(format)
        .toBuffer();
    } if (size === IMAGE_SIZE.MEDIUM) {
      return sharp(buffer).rotate(0).resize(180, 180).toFormat(format)
        .toBuffer();
    }
    if (size === IMAGE_SIZE.CONTAIN) {
      const defaultScale = 512;
      const width = _.get(metadata, 'width', defaultScale);
      const height = _.get(metadata, 'height', defaultScale);

      const resizePx = width > height ? width : height;

      return sharp(buffer).rotate(0).resize(resizePx, resizePx, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 },
      }).toBuffer();
    }

    if (format === IMAGES_FORMAT.GIF) return buffer;

    const width = this.getWidth(metadata);

    return sharp(buffer).resize(width).withMetadata()
      .toFormat(format)
      .toBuffer();
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
