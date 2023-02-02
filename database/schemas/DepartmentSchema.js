const mongoose = require('mongoose');

const { Schema } = mongoose;

const DepartmentSchema = new Schema({
  name: {
    type: String, required: true, unique: true, maxlength: 150,
  },
  search: { type: String, required: true },
  related: { type: [String], index: true, default: [] },
  objectsCount: { type: Number, default: 0 },
  level: { type: Number, index: true },
  sortScore: { type: Number },
}, { versionKey: false });

DepartmentSchema.index({ search: 'text' });

const DepartmentModel = mongoose.model('departments', DepartmentSchema);

module.exports = DepartmentModel;
