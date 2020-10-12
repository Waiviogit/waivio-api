const _ = require('lodash');
const { SUPPORTED_COLORS } = require('constants/sitesConstants');
const { App, Wobj } = require('models');

/** For different types of sites, different configurations will be available,
 * in this method we send to the front a list of allowed configurations for this site */
exports.getConfigurationsList = async (host) => {
  const { result } = await App.findOne({ host, inherited: true });
  if (!result) return { error: { status: 404, message: 'App not Found!' } };

  return { result: _.get(result, 'configuration') };
};

exports.saveConfigurations = async (params) => {
  const { result: app, error } = await App.findOne(
    { host: params.host, owner: params.userName, inherited: true },
  );
  if (error) return { error };
  if (!app) return { error: { status: 404, message: 'App not found' } };

  const dbConfigKeys = _.get(app.configuration, 'configurationFields');
  const keysForUpdate = Object.keys(_.omit(params.configuration, ['configurationFields']));
  /** Validate configuration keys, for different sites - can be different keys */
  if (!_.isEqual(dbConfigKeys.sort(), keysForUpdate.sort())) {
    return { error: { status: 422, message: `Configuration validation failed, not all keys exist, valid keys - ${dbConfigKeys.join(', ')}` } };
  }

  const dbColorKeys = _.get(app.configuration, 'configurationFields.colors', Object.values(SUPPORTED_COLORS));
  const colorsForUpdate = Object.keys(params.configuration.colors);
  /** Validate site colors, for different sites - can be different keys */
  if (!_.isEqual(dbColorKeys.sort(), colorsForUpdate.sort())) {
    return { error: { status: 422, message: `Configuration validation failed, not all keys exist in colors, valid keys - ${dbColorKeys.join(', ')}` } };
  }

  /** Check wobject to exist */
  const { result } = await Wobj.findOne(params.configuration.aboutObject);
  if (!result) return { error: { status: 422, message: 'Configuration validation failed, aboutObject not exist' } };

  const { result: updatedApp, error: updateError } = await App.findOneAndUpdate(
    { _id: app._id }, {
      configuration: Object.assign(params.configuration,
        { configurationFields: app.configuration.configurationFields }),
    },
  );
  if (updateError) return { error: updateError };
  return { result: updatedApp.configuration };
};
