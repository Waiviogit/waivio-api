const formidable = require('formidable');
const fsp = require('node:fs/promises');
const axios = require('axios');
const jo = require('jpeg-autorotate');
const crypto = require('node:crypto');

const prepareImage = async (req) => {
  const form = new formidable.IncomingForm();
  const {
    blobImage, imageUrl, type, userName, size,
  } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        blobImage: files?.file?.[0],
        imageUrl: fields?.imageUrl?.[0],
        type: fields?.type?.[0],
        userName: fields?.userName?.[0],
        size: fields?.size?.[0] || '',
      });
    });
  });
  let base64 = null;
  let originalFilename = null;

  if (blobImage) {
    originalFilename = blobImage.originalFilename;
    const options = { quality: 70 };
    try {
      const { buffer } = await jo.rotate(blobImage.filepath, options);
      base64 = buffer;
    } catch (error) {
      const data = await fsp.readFile(blobImage.filepath);
      base64 = data.toString('base64');
    }
  } else if (imageUrl) {
    base64 = await base64ByUrl(imageUrl);
    // Extract filename from URL if available
    try {
      originalFilename = new URL(imageUrl).pathname.split('/').pop();
    } catch (error) {
      originalFilename = null;
    }
  }

  const fileName = generateFileName({ type, userName, base64 });
  return {
    base64, fileName, size, originalFilename,
  };
};

const createHashFromBase64 = (base64Str, algorithm = 'sha256') => {
  const buffer = Buffer.from(base64Str, 'base64');
  const hash = crypto.createHash(algorithm);
  hash.update(buffer);
  return hash.digest('hex');
};

const generateFileName = ({ type, userName, base64 }) => {
  switch (type) {
    case 'avatar':
      return `avatar/${userName}`;
    default:
      return createHashFromBase64(base64);
  }
};

const base64ByUrl = async (url) => axios
  .get(url, {
    responseType: 'arraybuffer',
  })
// eslint-disable-next-line no-buffer-constructor
  .then((response) => new Buffer(response.data, 'binary').toString('base64'))
  .catch(() => null);

module.exports = {
  prepareImage, base64ByUrl, generateFileName, createHashFromBase64,
};
