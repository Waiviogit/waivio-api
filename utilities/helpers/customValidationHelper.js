const { ObjectId } = require('mongoose').Types;

exports.validateObjectId = (value, helpers) => (ObjectId.isValid(value) ? value : helpers.error('any.custom'));
