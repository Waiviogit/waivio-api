const { CURSOR_TIMEOUT } = require('../../constants/common');

function cursorTimeout(schema) {
  schema.pre('find', setCursorTimeout);
  schema.pre('findOne', setCursorTimeout);
  schema.pre('aggregate', setCursorTimeout);
}

function setCursorTimeout() {
  this.maxTimeMS(CURSOR_TIMEOUT);
}

module.exports = { cursorTimeout };
