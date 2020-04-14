const AWS = require('aws-sdk');
const sharp = require('sharp');
const parser = require('exif-parser');
const _ = require('lodash');
const ExifReader = require('exifreader');

class Image {
  constructor() {
    const spacesEndpoint = new AWS.Endpoint(process.env.AWS_ENDPOINT);

    this._s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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
              // console.log(data.Location);
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

  rotationSwitcher(number, height, width) {
    switch (number) {
      case 3:
        return 180;
      case 1:
        if (height && width && (width > height)) return 0;
        return 270;
      case 6:
        return 90;
      case 8:
        return 270;
      default:
        return 360;
    }
  }

  proportionalResize(imageSize) {
    const size = {};
    if (imageSize && imageSize.height && imageSize.width) {
      imageSize.height >= imageSize.width ? size.height = 1008 : size.width = 1008;
      switch (imageSize.height >= imageSize.width) {
        case true:
          imageSize.height >= 1008 ? size.height = 1008 : size.height = imageSize.height;
          break;
        case false:
          imageSize.width >= 1008 ? size.width = 1008 : size.width = imageSize.width;
          break;
      }
    } else {
      size.height = 1008;
    }
    return size;
  }

  // eslint-disable-next-line class-methods-use-this
  async resizeImage({ buffer, size }) {
    let metadata, tags;
    try {
      const parsedBuffer = parser.create(buffer);
      tags = ExifReader.load(buffer, { expanded: true });
      console.log(tags.exif.Orientation);
      metadata = parsedBuffer.parse();
    } catch (error) {
      metadata = null;
    }
    const rotation = this.rotationSwitcher(_.get(metadata, 'tags.Orientation', 0), _.get(metadata, 'imageSize.height', 0), _.get(metadata, 'imageSize.width', 0));
    if (size === '_small') {
      return sharp(buffer).rotate(rotation).resize(34, 34).toBuffer();
    } if (size === '_medium') {
      return sharp(buffer).rotate(rotation).resize(180, 180).toBuffer();
    }

    return sharp(buffer).rotate(rotation)
      .resize(this.proportionalResize(metadata ? metadata.imageSize : null))
      .toBuffer();
  }
}

const image = new Image();

module.exports = image;
