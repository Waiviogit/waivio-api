exports.ERROR_MESSAGE = {
  UNAVAILABLE: 'Service Unavailable',
  PARSE_IMAGE: 'Error parse image',
  UPLOAD_IMAGE: 'Error upload image',
  NOT_FOUND: 'Not Found',
  WEBSITE_UNAVAILABLE: 'Website Temporary Unavailable',
};

exports.RESPONSE_STATUS = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
};

exports.REQ_METHOD = {
  POST: 'POST',
};

exports.URL = {
  API: '/api',
  SITES: '/sites',
  HTTPS: 'https://',
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
