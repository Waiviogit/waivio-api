const { App } = require('models');

exports.create = async (params) => {

};

exports.availableCheck = async (params) => {
  const { result: parent } = await App.findOne({ host: params.parent, canBeExtended: true });
  if (!parent) return { error: { status: 422, message: 'Parent not exists' } };
  const { result: app } = await App.findOne({ host: `${params.name}.${params.parent}` });
  if (app) return { error: { status: 422, message: 'Parent not exists' } };
  return { result: true };
};

exports.getParentList = async (params) => {

};
