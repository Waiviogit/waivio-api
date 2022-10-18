const mongoose = require('mongoose');

const { Schema } = mongoose;

const DepartmentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  related: { type: [String], index: true, default: [] },
  objectsCount: { type: Number, default: 0 },
  level: { type: Number, index: true },
}, { versionKey: false });

const DepartmentModel = mongoose.model('departments', DepartmentSchema);

module.exports = DepartmentModel;
