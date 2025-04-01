const { isbot } = require('isbot');
const _ = require('lodash');
const moment = require('moment/moment');
const {
  WebsiteStatisticModel,
  App,
} = require('../../../models');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../../constants/common');
const { getCurrentDateString } = require('../../helpers/dateHelper');
const { redisSetter, redis } = require('../../redis');
const { redisStatisticsKey } = require('../../../constants/sitesConstants');

const setSiteActiveUser = async ({ userAgent, host, ip }) => {
  const bot = isbot(userAgent);
  const key = `${REDIS_KEYS.API_VISIT_STATISTIC}:${getCurrentDateString()}:${host}:${bot ? 'bot' : 'user'}`;

  await redisSetter.zincrbyExpire({
    key, ttl: TTL_TIME.THIRTY_DAYS, member: ip, increment: 1,
  });

  if (bot) return;
  await redisSetter.addSiteActiveUser(`${redisStatisticsKey}:${host}`, ip);
};

const setSiteAction = async ({ userAgent, host, ip }) => {
  const bot = isbot(userAgent);
  if (bot) return { error: { status: 401 } };

  await redisSetter.saddAsync({
    key: `${REDIS_KEYS.SITES_ACTION_UNIQ}:${host}`,
    values: ip,
    client: redis.appUsersStatistics,
  });

  await redisSetter.incr({
    key: `${REDIS_KEYS.SITES_ACTION_TOTAL}:${host}`,
    client: redis.appUsersStatistics,
  });

  return { result: true };
};

const getHostsForReport = async ({ host, userName }) => {
  const { result: apps = [] } = await App.find(
    {
      owner: userName,
      inherited: true,
    },
    {},
    {
      host: 1,
    },
  );
  if (host) {
    const isOwner = !!_.find(apps, (el) => el.host === host);
    return isOwner ? [host] : [];
  }

  return apps.map((el) => el.host);
};

const getStatisticReport = async ({
  startDate, endDate, host, userName, skip, limit,
}) => {
  const hosts = await getHostsForReport({ host, userName });
  if (!hosts?.length) return { result: [], hasMore: false };

  const { result, error } = await WebsiteStatisticModel.aggregate([
    {
      $match: {
        host: { $in: hosts },
        $and: [
          { createdAt: { $gt: startDate || moment.utc(1).toDate() } },
          { createdAt: { $lt: endDate || moment.utc().toDate() } }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
  ]);
  if (error) return { error };

  return {
    result: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

module.exports = {
  setSiteActiveUser,
  setSiteAction,
  getStatisticReport,
};
