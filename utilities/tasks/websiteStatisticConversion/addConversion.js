const { WebsiteStatistic } = require('../../../database').models;

const addConversionUniq = async () => {
  const statistic = WebsiteStatistic.find().lean();
  for await (const statisticElement of statistic) {
    let conversionUniq = 0;
    const { visits, buyActionUniq, _id } = statisticElement;
    if (visits !== 0) {
      conversionUniq = (buyActionUniq * 100) / visits;
    }

    await WebsiteStatistic.updateOne({ _id }, { conversionUniq });
  }
};

module.exports = addConversionUniq;
