const { EngineAdvancedReportModel, EngineAdvancedReportStatusModel } = require('models');
const _ = require('lodash');
const crypto = require('crypto');
const { ERROR_OBJ, SERVICE_NOTIFICATION_TYPES } = require('constants/common');
const notificationsHelper = require('utilities/helpers/notificationsHelper');
const BigNumber = require('bignumber.js');
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

const generateReport = async ({
  accounts, startDate, endDate, filterAccounts, user, currency, symbol, reportId,
}) => {
  let hasMore = true;
  do {
    const [stop, pause] = await Promise.all([
      checkGenerationForStop({ reportId }),
      checkGenerationForPause({ reportId }),
    ]);

    if (stop || pause) break;

    const { result, error } = await getWalletAdvancedReport({
      accounts, startDate, endDate, filterAccounts, user, currency, symbol, limit: 500,
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

    const docs = result.wallet.map((el) => ({
      ..._.omit(el, '_id'),
      reportId,
    }));

    await EngineAdvancedReportModel.insertMany(docs);
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
      id: SERVICE_NOTIFICATION_TYPES.UPDATE_REPORT,
      data: { account: user },
    });
  } while (hasMore);
};

const generateReportTask = async ({
  accounts, startDate, endDate, filterAccounts, user, currency, symbol,
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
    status: GENERATE_STATUS.IN_PROGRESS,
  });
  if (error) return { error };

  generateReport({
    accounts, startDate, endDate, filterAccounts, user, currency, symbol, reportId,
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
      sort: { _id: 1 },
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

  return { result: updated };
};

const stopGeneration = async ({ reportId, user }) => {
  const { result: updated } = await EngineAdvancedReportStatusModel.findOneAndUpdate({
    filter: { user, reportId, status: ACTIVE_STATUSES },
    update: { status: GENERATE_STATUS.STOPPED },
    options: { new: true },
  });

  return { result: updated };
};

const pauseGeneration = async ({ reportId, user }) => {
  const { result: updated } = await EngineAdvancedReportStatusModel.findOneAndUpdate({
    filter: { user, reportId, status: GENERATE_STATUS.IN_PROGRESS },
    update: { status: GENERATE_STATUS.PAUSED },
    options: { new: true },
  });

  return { result: updated };
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
