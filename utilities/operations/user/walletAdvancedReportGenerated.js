const { EngineAdvancedReportModel, EngineAdvancedReportStatusModel } = require('models');
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');

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
      accounts, startDate, endDate, filterAccounts, user, currency, symbol, limit: 50,
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
    /// same trx
    endDate = moment(result.wallet[result.wallet.length - 1].timestamp).toDate();

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
    if (!hasMore) {
      console.log();
    }

    // todo redis push notification
  } while (hasMore);
};

const generateReportTask = async ({
  accounts, startDate, endDate, filterAccounts, user, currency, symbol,
}) => {
  const reportId = crypto.randomUUID();
  // todo try create same with uniq index fields

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

  // todo remove await
  await generateReport({
    accounts, startDate, endDate, filterAccounts, user, currency, symbol, reportId,
  });

  return { result };
};

module.exports = {
  generateReportTask,
};
