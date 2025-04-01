const { expect } = require('chai');
const moment = require('moment');
const { WebsiteStatisticFactory } = require('../../factories');
const { getStatisticReport } = require('../../../utilities/operations/sites/sitesStatistic');
const { App } = require('../../../models');
const { dropDatabase } = require('../../testHelper');

describe('getStatisticReport', () => {
  let stats;
  const userName = 'testuser';
  const host = 'test.com';

  beforeEach(async () => {
    await dropDatabase();
    await App.create({ owner: userName, host, inherited: true });

    stats = await WebsiteStatisticFactory.createMany(5, {
      host,
      createdAt: moment.utc().subtract(1, 'day').toDate(),
    });
  });

  it('returns stats for specific host', async () => {
    const result = await getStatisticReport({
      host,
      userName,
      skip: 0,
      limit: 10,
    });

    expect(result.result).to.have.length(5);
    expect(result.hasMore).to.be.false;
  });

  it('respects limit and pagination', async () => {
    const result = await getStatisticReport({
      host,
      userName,
      skip: 0,
      limit: 2,
    });

    expect(result.result).to.have.length(2);
    expect(result.hasMore).to.be.true;
  });

  it('filters by date range', async () => {
    const startDate = moment.utc().subtract(2, 'days').toDate();
    const endDate = moment.utc().toDate();

    const result = await getStatisticReport({
      host,
      userName,
      startDate,
      endDate,
      skip: 0,
      limit: 10,
    });

    expect(result.result).to.have.length(5);
  });

  it('returns empty array for unauthorized host', async () => {
    const result = await getStatisticReport({
      host: 'unauthorized.com',
      userName,
      skip: 0,
      limit: 10,
    });

    expect(result.result).to.have.length(0);
    expect(result.hasMore).to.be.false;
  });
});
