const {
  ERROR_MESSAGE, AWSS3_IMAGE_PARAMS, IMAGE_SIZE, IMAGES_FORMAT,
} = require('constants/common');
const sharp = require('sharp');
const zlib = require('zlib');
const _ = require('lodash');
const heicConvert = require('heic-convert');
const AWS = require('@aws-sdk/client-s3');

const convertWithHeicLib = async (buffer) => {
  try {
    const result = await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 1,
    });

    return { result };
  } catch (error) {
    return { error };
  }
};

class Image {
  constructor() {
    this._s3 = new AWS.S3({
      forcePathStyle: false,
      endpoint: 'https://nyc3.digitaloceanspaces.com',
      region: 'nyc3',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadInS3(base64, fileName, size = '') {
    if (base64) {
      try {
        // eslint-disable-next-line no-buffer-constructor
        const buffer = Buffer.from(base64, 'base64');
        const body = await this.resizeImage({ buffer, size });
        const gzip = await gzipPromised(body);
        const key = `${fileName}${size}`;

        const uploadedObject = await this._s3.putObject({
          ...AWSS3_IMAGE_PARAMS,
          ContentEncoding: 'gzip',
          Body: gzip,
          Key: `${fileName}${size}`,
        });

        if (uploadedObject?.$metadata?.httpStatusCode !== 200) {
          return { error: `${ERROR_MESSAGE.UPLOAD_IMAGE}` };
        }

        return { imageUrl: `https://waivio.nyc3.digitaloceanspaces.com/${key}` };
      } catch (error) {
        return { error };
      }
    }
    return { error: ERROR_MESSAGE.PARSE_IMAGE };
  }

  getWidth(metadata) {
    const defaultWidthH = 1920;
    const defaultWidthV = 1080;
    if (metadata?.format === 'svg') return defaultWidthH;
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
      const { result: convHeic } = await convertWithHeicLib(buffer);
      if (convHeic) buffer = convHeic;
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

      let resizePx = width > height ? width : height;
      if (metadata?.format === 'svg') resizePx = 1024;

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
