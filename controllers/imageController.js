const image = require('../utilities/images/image');
const { prepareImage } = require('../utilities/helpers/imagesHelper');
const { ERROR_MESSAGE, IMAGE_SIZE } = require('../constants/common');

const saveImage = async (req, res) => {
  const {
    base64, fileName, size, originalFilename,
  } = await prepareImage(req);
  const { imageUrl, error } = await image.uploadInS3(base64, fileName, size, { originalFilename });

  if (error) {
    if (error === ERROR_MESSAGE.UNAVAILABLE) {
      return res
        .status(503)
        .send({ error })
        .end(Promise.reject(new Error(ERROR_MESSAGE.UNAVAILABLE)));
    }
    return res.status(422).send({ error });
  }
  if (!req.query.notResizing) {
    await image.uploadInS3(base64, fileName, IMAGE_SIZE.SMALL);
    await image.uploadInS3(base64, fileName, IMAGE_SIZE.MEDIUM);
  }
  return res.status(200).json({ image: imageUrl });
};

module.exports = { saveImage };
