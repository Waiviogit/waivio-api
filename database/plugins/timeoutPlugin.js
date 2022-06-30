const { CURSOR_TIMEOUT } = require('../../constants/common');

function cursorTimeout(schema) {
  schema.pre('find', setCursorFindTimeout);
  schema.pre('findOne', setCursorFindTimeout);
//  schema.pre('aggregate', setCursorAggregateTimeout);
}

function setCursorFindTimeout() {
  this.maxTimeMS(CURSOR_TIMEOUT);
}

function setCursorAggregateTimeout() {
  this.options = { maxTimeMS: CURSOR_TIMEOUT };
}

module.exports = { cursorTimeout };
