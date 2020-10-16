const { App } = require('models');
const siteHelper = require('utilities/helpers/sitesHelper');

exports.set = async ({ userName, host, mapCoordinates }) => {
  const { result, error } = await App.findOneAndUpdate(
    { owner: userName, inherited: true, host }, { $set: { mapCoordinates } },
  );
  if (error) return { error };
  if (!result) return { error: { status: 404, message: 'App not found!' } };

  await siteHelper.updateSupportedObjects({ host: result.host, app: result });
  return { result: result.mapCoordinates };
};

exports.get = async ({ host }) => {
  const { result: app, error } = await App.findOne({ host, inherited: true });
  if (error) return { error };
  if (!app) return { error: { status: 404, message: 'App not found!' } };
  return { result: app.mapCoordinates };
};
