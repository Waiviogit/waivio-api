const { EngineAdvancedReportModel, EngineAdvancedReportStatusModel } = require('models');
const _ = require('lodash');
const crypto = require('crypto');
const { ERROR_OBJ } = require('constants/common');
const { getWalletAdvancedReport } = require('./getWalletAdvancedReport');

const GENERATE_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ERRORED: 'ERRORED',
};

const generateReport = async ({
  accounts, startDate, endDate, filterAccounts, user, currency, symbol, reportId,
}) => {
  let hasMore = true;
  do {
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
        $inc: {
          deposits: result.deposits ?? 0,
          withdrawals: result.withdrawals ?? 0,
        },
        ...!hasMore && { status: GENERATE_STATUS.COMPLETED },
      },
    });

    // todo redis push notification
  } while (hasMore);
};

const generateReportTask = async ({
  accounts, startDate, endDate, filterAccounts, user, currency, symbol,
}) => {
  const { result: inProgress } = await EngineAdvancedReportStatusModel.findOne({
    filter: { user, status: GENERATE_STATUS.IN_PROGRESS },
  });
  if (inProgress) {
    return { error: { status: 422, message: 'Нou can only generate one report at a time' } };
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

  return { result };
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
    },
  };
};

const getInProgress = async ({ user }) => {
  const { result } = await EngineAdvancedReportStatusModel.findOne({
    filter: { user, status: GENERATE_STATUS.IN_PROGRESS },
  });

  return { result };
};

const getHistory = async ({ user }) => {
  const { result } = await EngineAdvancedReportStatusModel.findOne({
    filter: { user, status: { $in: [GENERATE_STATUS.COMPLETED, GENERATE_STATUS.ERRORED] } },
    options: { sort: { _id: -1 } },
  });

  return { result };
};

const fieldToInc = {
  d: 'deposits',
  w: 'withdrawals',
  default: '',
};

const selectDeselectRecord = async ({ trxId, reportId, user }) => {
  const { result } = await EngineAdvancedReportStatusModel.findOne({
    filter: { user, reportId },
  });
  if (!result) return { error: ERROR_OBJ.NOT_FOUND };

  const { result: record } = await EngineAdvancedReportModel.findOne({
    filter: { _id: trxId, reportId },
  });

  const incAmount = record[result.currency];
  const checked = !record.checked;

  const field = fieldToInc[record.withdrawDeposit] || fieldToInc.default;

  if (!field) {
    await EngineAdvancedReportModel.updateOne({
      filter: { _id: trxId, reportId },
      update: { checked },
    });
    return { result: 'ok' };
  }

  await EngineAdvancedReportModel.updateOne({
    filter: { _id: trxId, reportId },
    update: { checked },
  });

  await EngineAdvancedReportStatusModel.updateOne({
    filter: { user, reportId },
    update: { $inc: { [field]: checked ? -incAmount : incAmount } },
  });
  return { result: 'ok' };
};

module.exports = {
  generateReportTask,
  getGeneratedReport,
  getInProgress,
  getHistory,
  selectDeselectRecord,
};
