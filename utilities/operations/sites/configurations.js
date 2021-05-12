const _ = require('lodash');
const { App, Wobj } = require('models');
const { sitesHelper } = require('utilities/helpers');

/** For different types of sites, different configurations will be available,
 * in this method we send to the front a list of allowed configurations for this site */
exports.getConfigurationsList = async (host) => {
  let { result } = await App.findOne({ host });
  if (!result) return { error: { status: 404, message: 'App not Found!' } };
  result = await sitesHelper.aboutObjectFormat(result);
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
  if (_.some(keysForUpdate, (el) => !_.includes(dbConfigKeys, el))) {
    return { error: { status: 422, message: `Configuration validation failed, not all keys allowed to update, valid keys - ${dbConfigKeys.join(', ')}` } };
  }

  /** Check wobject to exist */
  if (_.get(params, 'configuration.aboutObject')) {
    const { result } = await Wobj.findOne({ author_permlink: params.configuration.aboutObject });
    if (!result) return { error: { status: 422, message: 'Configuration validation failed, aboutObject not exist' } };
  }

  const { result: updatedApp, error: updateError } = await App.findOneAndUpdate(
    { _id: app._id }, {
      configuration: {
        ...app.configuration,
        ...params.configuration,
      },
    },
  );
  if (updateError) return { error: updateError };

  const result = await sitesHelper.aboutObjectFormat(updatedApp);
  return { result: _.get(result, 'configuration') };
};
