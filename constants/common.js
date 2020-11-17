exports.ERROR_MESSAGE = {
  UNAVAILABLE: 'Service Unavailable',
  PARSE_IMAGE: 'Error parse image',
  UPLOAD_IMAGE: 'Error upload image',
};

exports.AWSS3_IMAGE_PARAMS = {
  Bucket: 'waivio',
  ACL: 'public-read',
  ContentType: 'image/webp',
  ContentEncoding: 'base64',
};

exports.IMAGE_SIZE = {
  SMALL: '_small',
  MEDIUM: '_medium',
};
