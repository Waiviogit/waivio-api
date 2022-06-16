const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const { WARNING_REQ_TIME } = require('constants/common');
const _ = require('lodash');

const Sentry = require('@sentry/node');

exports.getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

exports.responseOnClose = ({ session }) => {
  const reqInfo = session.get('reqInfo');
  if (_.isEmpty(reqInfo)) return;
  const requestTime = this.getDurationInMilliseconds(reqInfo.timeStart);
  if (requestTime > WARNING_REQ_TIME) {
    //sendSentryNotification();
    Sentry.captureException({ ...reqInfo, requestTime });
  }
};
