const { App } = require('models');

exports.getAppAdmins = async (name) => {
  const { app, error } = await App.getOne({ name });
  if (error) return { error };
  return { admins: app.admins };
};
