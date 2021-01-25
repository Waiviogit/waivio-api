exports.ERROR_MESSAGE = {
  UNAVAILABLE: 'Service Unavailable',
  PARSE_IMAGE: 'Error parse image',
  UPLOAD_IMAGE: 'Error upload image',
  NOT_FOUND: 'Not Found',
};

exports.RESPONSE_STATUS = {
  NOT_FOUND: 404,
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
