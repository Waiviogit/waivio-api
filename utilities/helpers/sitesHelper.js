const _ = require('lodash');
const moment = require('moment');
const { App } = require('models');

exports.createApp = async (params) => {
  const { error } = await this.availableCheck(params);
  if (error) return { error };
  params.host = `${params.name}.${params.parent}`;
  const { result, error: createError } = await App.create(params);
  if (createError) return { error: createError };
  return { result: !!result };
};

exports.availableCheck = async (params) => {
  const { result: parent } = await App.findOne({ _id: params.parentId, canBeExtended: true });
  if (!parent) return { error: { status: 404, message: 'Parent not found' } };
  const { result: app } = await App.findOne({ host: `${params.name}.${parent.host}` });
  if (app) return { error: { status: 409, message: 'Subdomain already exists' } };
  return { result: true };
};

exports.getParentsList = async () => {
  const { result: parents, error } = await App.find({ canBeExtended: true });
  if (error) return { error };
  return {
    parents: _.map(parents, (parent) => ({ domain: parent.host, _id: parent._id.toString() })),
  };
};

exports.getUserApps = async (params) => {
  const { result: apps, error } = await App.find({
    owner: params.userName,
    inherited: true,
    $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
  });
  if (error) return { error };

  return { result: _.map(apps, 'domain') };
};
