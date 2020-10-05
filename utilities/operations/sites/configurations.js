const _ = require('lodash');
const { App } = require('models');

/** For different types of sites, different configurations will be available,
 * in this method we send to the front a list of allowed configurations for this site */
exports.getConfigurationsList = async (host) => {
  const { result } = await App.findOne({ host, inherited: true });
  if (!result) return { error: { status: 404, message: 'App not Found!' } };

  return { result: _.get(result, 'configuration.configurationFields', []) };
};

exports.saveConfigurations = async (params) => {

};
