const { AUTH_TYPES } = require('../constants/usersData');

const AUTH_HEADERS = [
  {
    name: 'access-token',
    in: 'header',
    required: true,
    type: 'string',
  },
  {
    name: 'auth-type',
    in: 'header',
    required: true,
    type: 'string',
    enum: AUTH_TYPES,
  },
];

module.exports = {
  AUTH_HEADERS,
};
