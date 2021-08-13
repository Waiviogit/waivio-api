const image = require('utilities/images/image');
const {
  base64ByUrl,
  generateFileName,
} = require('utilities/helpers/imagesHelper');

exports.parseImage = async (data) => {
  const { imageUrl, error } = await image.uploadInS3(
    await base64ByUrl(data.image),
    await generateFileName({}),
  );
  if (error) return { error: { status: 406, message: 'Error download image to S3' } };
  return imageUrl;
};

exports.createRoute = (data) => `type=${data.type}&${data.category}=${data.tag}`;
