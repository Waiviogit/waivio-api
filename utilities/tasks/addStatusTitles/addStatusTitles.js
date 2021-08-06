const config = require('config');
const { DEVICE } = require('constants/common');
const { createNamespace } = require('cls-hooked');
const { WObject, App } = require('database').models;
const { FIELDS_NAMES } = require('constants/wobjectsData');
const wobjectHelper = require('utilities/helpers/wObjectHelper');

module.exports = async () => {
  const wobjects = await WObject.find({}, { fields: 1 }).lean();
  const app = await App.findOne({ host: config.appHost }).lean();
  const session = createNamespace('request-session');
  session.run(() => session.set('device', DEVICE.MOBILE));

  for (const wobject of wobjects) {
    const { status } = await wobjectHelper.processWobjects({
      wobjects: [wobject], app, fields: [FIELDS_NAMES.STATUS], returnArray: false,
    });
    if (!status) continue;
    await WObject.updateOne({ _id: wobject._id }, { 'status.title': JSON.parse(status).title });
  }
};
