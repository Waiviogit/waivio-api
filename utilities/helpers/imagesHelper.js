const uuid = require('uuid/v4');
const formidable = require('formidable');
const fs = require('fs');
const axios = require('axios');
const jo = require('jpeg-autorotate');

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
        blobImage: files.file,
        imageUrl: fields.imageUrl,
        type: fields.type,
        userName: fields.userName,
        size: fields.size || '',
      });
    });
  });
  let base64 = null;

  if (blobImage) {
    const options = { quality: 70 };
    try {
      const { buffer } = await jo.rotate(blobImage.path, options);
      base64 = buffer;
    } catch (error) {
      const data = fs.readFileSync(blobImage.path);
      base64 = data.toString('base64');
    }
  } else if (imageUrl) {
    base64 = await base64ByUrl(imageUrl);
  }
  const fileName = await generateFileName({ type, userName });

  return { base64, fileName, size };
};

const generateFileName = async ({ type, userName }) => {
  switch (type) {
    case 'avatar':
      return `avatar/${userName}`;
    default:
      return `${Math.round(new Date() / 1000)}_${uuid()}`;
  }
};

const base64ByUrl = async (url) => axios
  .get(url, {
    responseType: 'arraybuffer',
  })
// eslint-disable-next-line no-buffer-constructor
  .then((response) => new Buffer(response.data, 'binary').toString('base64'))
  .catch((error) => {
    console.error('BASE64 BY URL ERROR', error);
    return null;
  });

module.exports = { prepareImage, base64ByUrl, generateFileName };
