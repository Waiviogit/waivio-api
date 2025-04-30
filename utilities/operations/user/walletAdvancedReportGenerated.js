const _ = require('lodash');
const crypto = require('crypto');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const { EngineAdvancedReportModel, EngineAdvancedReportStatusModel } = require('../../../models');
const { ERROR_OBJ, SERVICE_NOTIFICATION_TYPES } = require('../../../constants/common');
const notificationsHelper = require('../../helpers/notificationsHelper');
const { getWalletAdvancedReport } = require('./getWalletAdvancedReport');

const GENERATE_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ERRORED: 'ERRORED',
  STOPPED: 'STOPPED',
  PAUSED: 'PAUSED',
};

const ACTIVE_STATUSES = [
  GENERATE_STATUS.IN_PROGRESS,
  GENERATE_STATUS.ERRORED,
  GENERATE_STATUS.PAUSED,
];

const HISTORY_STATUSES = [
  GENERATE_STATUS.COMPLETED,
  GENERATE_STATUS.STOPPED,
];

const checkGenerationForStop = async ({ reportId }) => {
  const { result } = await EngineAdvancedReportStatusModel.findOne({
    filter: { reportId, status: GENERATE_STATUS.STOPPED },
    projection: { reportId: 1 },
  });

  return !!result;
};

const checkGenerationForPause = async ({ reportId }) => {
  const { result } = await EngineAdvancedReportStatusModel.findOne({
    filter: { reportId, status: GENERATE_STATUS.PAUSED },
    projection: { reportId: 1 },
  });

  return !!result;
};

const getFoldCountObject = () => ({
  quantity: 0, // string add
  timestamp: 0, // check  30 days from first
  USD: 0, // number add
  doc: null,
});

const setInitialDoc = ({ rewardObject, record }) => {
  rewardObject.quantity = BigNumber(record?.quantity || 0);
  rewardObject.timestamp = record.timestamp;
  rewardObject.USD = BigNumber(record?.USD || 0);
  rewardObject.doc = record;
};

const updateFoldObject = ({ rewardObject, record }) => {
  rewardObject.quantity = rewardObject.quantity.plus(record?.quantity || 0);
  rewardObject.USD = rewardObject.USD.plus(record?.USD || 0);
};

const createObjectForSave = (foldObject, reportId, rewardAccounts) => (_.omit({
  ...foldObject.doc,
  quantity: foldObject.quantity.toFixed(),
  USD: foldObject.USD.toNumber(),
  WAIV: {
    USD: foldObject.USD.dividedBy(foldObject.quantity).toNumber(),
  },
  authorperm: '',
  reportId,
  operation: 'comment_rewards',
  account: rewardAccounts,
}, '_id'));

const saveRewardObject = async (object, reportId, rewardAccounts) => {
  if (!object.doc) return;
  await EngineAdvancedReportModel.insert(createObjectForSave(object, reportId, rewardAccounts));
};

const REWARDS_OPS = ['comments_authorReward', 'comments_curationReward', 'comments_beneficiaryReward'];

const generateReport = async ({
  accounts, startDate, endDate, filterAccounts, user, currency, symbol, reportId, addSwaps,
}) => {
  let hasMore = true;
  let rewardObject = getFoldCountObject();

  const rewardAccounts = accounts.map((el) => el.name).join(', ');

  do {
    const [stop, pause] = await Promise.all([
      checkGenerationForStop({ reportId }),
      checkGenerationForPause({ reportId }),
    ]);

    if (stop || pause) break;

    const { result, error } = await getWalletAdvancedReport({
      accounts, startDate, endDate, filterAccounts, user, currency, symbol, limit: 500, addSwaps,
    });

    if (error) {
      await EngineAdvancedReportStatusModel.updateOne({
        filter: { reportId, user },
        update: {
          status: GENERATE_STATUS.ERRORED,
        },
      });
      break;
    }

    hasMore = result.hasMore;
    accounts = result.accounts;

    // map docs and fold rewards
    const docs = [];

    for (const record of result.wallet) {
      const { operation, timestamp } = record;

      const isRewardOp = REWARDS_OPS.includes(operation);
      if (!isRewardOp) {
        // save previous object
        await saveRewardObject(rewardObject, reportId, rewardAccounts);
        // reset state
        rewardObject = getFoldCountObject();
        docs.push({ ..._.omit(record, '_id'), reportId });
        // reset state
        continue;
      }
      if (!rewardObject.doc) {
        setInitialDoc({ rewardObject, record });
        continue;
      }

      const monthBeforeFirstRecord = moment.unix(timestamp)
        .isBefore(moment.unix(rewardObject.timestamp)
          .subtract(30, 'days'));

      if (monthBeforeFirstRecord) {
        // update
        updateFoldObject({ rewardObject, record });
        // save previous object
        await saveRewardObject(rewardObject, reportId, rewardAccounts);
        // reset state
        rewardObject = getFoldCountObject();
        continue;
      }

      updateFoldObject({ rewardObject, record });
    }
    if (docs.length) await EngineAdvancedReportModel.insertMany(docs);

    await EngineAdvancedReportStatusModel.updateOne({
      filter: { reportId, user },
      update: {
        accounts,
        $inc: {
          deposits: result.deposits ?? 0,
          withdrawals: result.withdrawals ?? 0,
        },
        ...!hasMore && { status: GENERATE_STATUS.COMPLETED },
      },
    });

    notificationsHelper.sendServiceNotification({
      id: hasMore
        ? SERVICE_NOTIFICATION_TYPES.UPDATE_REPORT
        : SERVICE_NOTIFICATION_TYPES.FINISH_REPORT,
      data: { account: user },
    });

    if (!hasMore) {
      // save previous object with certain type
      await saveRewardObject(rewardObject, reportId, rewardAccounts);
    }
  } while (hasMore);
};

const generateReportTask = async ({
  accounts, startDate, endDate, filterAccounts, user, currency, symbol, addSwaps,
}) => {
  const { result: inProgress } = await EngineAdvancedReportStatusModel.countDocuments({
    filter: { user, status: GENERATE_STATUS.IN_PROGRESS },
  });

  if (inProgress >= 12) {
    return { error: { status: 422, message: 'You can only generate 12 reports at a time' } };
  }

  const reportId = crypto.randomUUID();

  const { result, error } = await EngineAdvancedReportStatusModel.create({
    reportId,
    startDate,
    endDate,
    accounts,
    filterAccounts,
    user,
    currency,
    symbol,
    addSwaps,
    status: GENERATE_STATUS.IN_PROGRESS,
  });
  if (error) return { error };

  generateReport({
    accounts, startDate, endDate, filterAccounts, user, currency, symbol, reportId, addSwaps,
  });

  return {
    result: {
      ...result,
      deposits: '0',
      withdrawals: '0',
    },
  };
};

const getGeneratedReport = async ({ reportId, skip = 0, limit }) => {
  const { result } = await EngineAdvancedReportStatusModel.findOne({
    filter: { reportId },
  });
  if (!result) return { error: ERROR_OBJ.NOT_FOUND };
  if (result.status !== GENERATE_STATUS.COMPLETED) return { error: { status: 422, message: 'report generating in progress' } };

  const { result: report } = await EngineAdvancedReportModel.find({
    filter: { reportId },
    options: {
      sort: { timestamp: -1, _id: 1 },
      skip,
      limit: limit + 1,
    },
  });

  return {
    result: {
      wallet: _.take(report, limit),
      hasMore: report.length > limit,
      deposits: BigNumber(result.deposits).toString(),
      withdrawals: BigNumber(result.withdrawals).toString(),
      currency: result.currency,
      filterAccounts: result.filterAccounts,
      addSwaps: !!result.addSwaps,
    },
  };
};

const getInProgress = async ({ user }) => {
  const { result } = await EngineAdvancedReportStatusModel.aggregate(
    [
      {
        $match: { user, status: { $in: ACTIVE_STATUSES } },
      },
      {
        $addFields: {
          deposits: { $toString: '$deposits' },
          withdrawals: { $toString: '$withdrawals' },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ],
  );

  return { result };
};

const getHistory = async ({ user }) => {
  const { result } = await EngineAdvancedReportStatusModel.aggregate(
    [
      {
        $match: { user, status: { $in: HISTORY_STATUSES } },
      },
      {
        $addFields: {
          deposits: { $toString: '$deposits' },
          withdrawals: { $toString: '$withdrawals' },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ],
  );

  return { result };
};

const fieldToInc = {
  d: 'deposits',
  w: 'withdrawals',
  default: '',
};

const selectDeselectRecord = async ({ _id, reportId, user }) => {
  const { result } = await EngineAdvancedReportStatusModel.findOne({
    filter: { user, reportId },
  });
  if (!result) return { error: ERROR_OBJ.NOT_FOUND };

  const { result: record } = await EngineAdvancedReportModel.findOne({
    filter: { _id, reportId },
  });

  const incAmount = record[result.currency];
  const checked = !record.checked;

  const field = fieldToInc[record.withdrawDeposit] || fieldToInc.default;

  if (!field) {
    const { result: updated } = await EngineAdvancedReportModel.findOneAndUpdate({
      filter: { _id, reportId },
      update: { checked },
      options: { new: true },
    });
    return { result: updated };
  }

  await EngineAdvancedReportStatusModel.updateOne({
    filter: { user, reportId },
    update: { $inc: { [field]: checked ? -incAmount : incAmount } },
  });

  const { result: updated } = await EngineAdvancedReportModel.findOneAndUpdate({
    filter: { _id, reportId },
    update: { checked },
    options: { new: true },
  });
  return { result: updated };
};

const resumeGeneration = async ({ reportId, user }) => {
  const { result: inProgress } = await EngineAdvancedReportStatusModel.countDocuments({
    filter: { user, status: GENERATE_STATUS.IN_PROGRESS },
  });
  if (inProgress >= 12) {
    return { error: { status: 422, message: 'You can only generate 12 reports at a time' } };
  }

  const { result: resume } = await EngineAdvancedReportStatusModel.findOne({
    filter: { user, reportId, status: { $in: [GENERATE_STATUS.ERRORED, GENERATE_STATUS.PAUSED] } },
  });

  if (!resume) return { error: ERROR_OBJ.NOT_FOUND };
  const { result: updated } = await EngineAdvancedReportStatusModel.findOneAndUpdate({
    filter: { user, reportId },
    update: { status: GENERATE_STATUS.IN_PROGRESS },
    options: { new: true },
  });

  generateReport(resume);

  return {
    result: {
      ...updated,
      deposits: BigNumber(updated.deposits).toString(),
      withdrawals: BigNumber(updated.withdrawals).toString(),
    },
  };
};

const stopGeneration = async ({ reportId, user }) => {
  const { result: updated } = await EngineAdvancedReportStatusModel.findOneAndUpdate({
    filter: { user, reportId, status: ACTIVE_STATUSES },
    update: { status: GENERATE_STATUS.STOPPED },
    options: { new: true },
  });

  return {
    result: {
      ...updated,
      deposits: BigNumber(updated.deposits).toString(),
      withdrawals: BigNumber(updated.withdrawals).toString(),
    },
  };
};

const pauseGeneration = async ({ reportId, user }) => {
  const { result: updated } = await EngineAdvancedReportStatusModel.findOneAndUpdate({
    filter: { user, reportId, status: GENERATE_STATUS.IN_PROGRESS },
    update: { status: GENERATE_STATUS.PAUSED },
    options: { new: true },
  });

  return {
    result: {
      ...updated,
      deposits: BigNumber(updated.deposits).toString(),
      withdrawals: BigNumber(updated.withdrawals).toString(),
    },
  };
};

module.exports = {
  generateReportTask,
  getGeneratedReport,
  getInProgress,
  getHistory,
  selectDeselectRecord,
  stopGeneration,
  pauseGeneration,
  resumeGeneration,
};
