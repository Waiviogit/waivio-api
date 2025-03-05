const {
  faker, expect, sinon, redis, dropDatabase, _, AppModel,
} = require('test/testHelper');
const Sentry = require('@sentry/node');
const { collectSiteDebts } = require('utilities/operations/sites');
const {
  STATUSES, FEE, redisStatisticsKey, TEST_DOMAINS, PAYMENT_DESCRIPTION,
} = require('constants/sitesConstants');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { OBJECT_BOT } = require('constants/requestData');
const { AppFactory, WebsitePaymentsFactory } = require('test/factories');

describe('on collectSiteDebts', async () => {
  describe('on dailyDebt', async () => {
    let parent;
    beforeEach(async () => {
      await dropDatabase();
      sinon.stub(Sentry, 'captureException').returns('Ok');
      parent = await AppFactory.Create({ inherited: false, canBeExtended: true, host: TEST_DOMAINS[0] });
    });
    afterEach(async () => {
      sinon.restore();
    });
    describe('on OK', async () => {
      beforeEach(() => {
        sinon.stub(objectBotRequests, 'sendCustomJson').returns(Promise.resolve({ result: true }));
        sinon.stub(collectSiteDebts, 'checkForTestSites').returns(Promise.resolve(true));
      });
      describe('on active website', async () => {
        let app;
        beforeEach(async () => {
          const name = faker.random.string();
          app = await AppFactory.Create({ host: `${name}.${parent.host}`, status: STATUSES.ACTIVE });
        });
        describe('Without users', async () => {
          let amount;
          beforeEach(async () => {
            amount = _.random(10, 100);
            await WebsitePaymentsFactory.Create({ amount, name: app.owner });
          });
          it('should call object bot method', async () => {
            await collectSiteDebts.dailyDebt(1);
            expect(objectBotRequests.sendCustomJson.calledOnce).to.be.true;
          });
          it('should call object bot method with correct params', async () => {
            await collectSiteDebts.dailyDebt(1);
            expect(objectBotRequests.sendCustomJson.calledWith(
              {
                description: PAYMENT_DESCRIPTION.HOSTING_FEE,
                amount: FEE.minimumValue,
                userName: app.owner,
                countUsers: 0,
                host: app.host,
              },
              `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
            )).to.be.true;
          });
        });
        describe('With many users', async () => {
          let counter, amount;
          beforeEach(async () => {
            counter = _.random(1000, 2000);
            amount = _.random(10, 100);
            const users = [];
            for (let i = 0; i < counter; i++) users.push(faker.internet.ip());
            await redis.appUsersStatistics.saddAsync(`${redisStatisticsKey}:${app.host}`, ...users);
            await WebsitePaymentsFactory.Create({ amount, name: app.owner });
          });
          it('should call object bot method with correct params ', async () => {
            await collectSiteDebts.dailyDebt(1);
            expect(objectBotRequests.sendCustomJson.calledWith(
              {
                description: PAYMENT_DESCRIPTION.HOSTING_FEE,
                amount: FEE.perUser * counter,
                userName: app.owner,
                countUsers: counter,
                host: app.host,
              },
              `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
            )).to.be.true;
          });
          it('should delete keys from redis', async () => {
            await collectSiteDebts.dailyDebt(1);
            const result = await redis.appUsersStatistics.smembersAsync(`${redisStatisticsKey}:${app.host}`);
            expect(result).to.have.length(0);
          });
        });
      });

      describe('on inactive or pending website', async () => {
        let app;
        beforeEach(async () => {
          const name = faker.random.string();
          app = await AppFactory.Create({
            host: `${name}.${parent.host}`,
            status: _.sample([STATUSES.INACTIVE, STATUSES.PENDING]),
          });
        });
        it('should call objects bot method with correct params if site deactivated or pending', async () => {
          await collectSiteDebts.dailyDebt(1);
          expect(objectBotRequests.sendCustomJson.calledWith(
            {
              description: PAYMENT_DESCRIPTION.RESERVATION,
              amount: FEE.perInactive,
              userName: app.owner,
              countUsers: 0,
              host: app.host,
            },
            `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
          )).to.be.true;
        });
      });
    });

    describe('on error', async () => {
      beforeEach(async () => {
        sinon.stub(collectSiteDebts, 'checkForTestSites').returns(Promise.resolve(true));
        const name = faker.random.string();
        await AppFactory.Create({ host: `${name}.${parent.host}`, status: STATUSES.ACTIVE });
      });
      it('should call sentry if object bot method return error', async () => {
        sinon.stub(objectBotRequests, 'sendCustomJson').returns(Promise.resolve({ error: true }));
        await collectSiteDebts.dailyDebt(1);
        expect(Sentry.captureException.calledOnce).to.be.true;
      });
      it('should call sentry method with DB error', async () => {
        sinon.stub(AppModel, 'find').returns(Promise.resolve({ error: true }));
        await collectSiteDebts.dailyDebt(1);
        expect(Sentry.captureException.calledOnce).to.be.true;
      });
    });

    describe('on suspended status', async () => {
      beforeEach(async () => {
        sinon.spy(objectBotRequests, 'sendCustomJson');
        await AppFactory.Create({
          host: `${faker.random.string()}.${parent.host}`, status: STATUSES.SUSPENDED,
        });
      });
      it('should not call objectBotRequests', async () => {
        expect(objectBotRequests.sendCustomJson.called).to.be.false;
      });
    });
  });

  describe('On dailySuspendedDebt', async () => {
    let parent, app;
    beforeEach(async () => {
      await dropDatabase();
      sinon.stub(Sentry, 'captureException').returns('Ok');
      parent = await AppFactory
        .Create({ inherited: false, canBeExtended: true, host: TEST_DOMAINS[0] });
    });
    afterEach(async () => {
      sinon.restore();
    });

    describe('on ok', async () => {
      beforeEach(async () => {
        sinon.stub(objectBotRequests, 'sendCustomJson').returns(Promise.resolve({ result: true }));
        sinon.stub(collectSiteDebts, 'checkForTestSites').returns(Promise.resolve(true));
        app = await AppFactory.Create({
          host: `${faker.random.string()}.${parent.host}`, status: STATUSES.SUSPENDED,
        });
      });

      it('should call object bot method', async () => {
        await collectSiteDebts.dailySuspendedDebt(1);
        expect(objectBotRequests.sendCustomJson.calledOnce).to.be.true;
      });

      it('should call object bot method with correct params', async () => {
        await collectSiteDebts.dailySuspendedDebt(1);
        expect(objectBotRequests.sendCustomJson.calledWith(
          {
            description: PAYMENT_DESCRIPTION.RESERVATION,
            amount: FEE.perInactive,
            userName: app.owner,
            countUsers: 0,
            host: app.host,
          },
          `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
        )).to.be.true;
      });
    });

    describe('on error', async () => {
      beforeEach(async () => {
        sinon.stub(collectSiteDebts, 'checkForTestSites').returns(Promise.resolve(true));
        const name = faker.random.string();
        await AppFactory.Create({ host: `${name}.${parent.host}`, status: STATUSES.SUSPENDED });
      });
      it('should call sentry if object bot method return error', async () => {
        sinon.stub(objectBotRequests, 'sendCustomJson').returns(Promise.resolve({ error: true }));
        await collectSiteDebts.dailySuspendedDebt(1);
        expect(Sentry.captureException.calledOnce).to.be.true;
      });
      it('should call sentry method with DB error', async () => {
        sinon.stub(AppModel, 'find').returns(Promise.resolve({ error: true }));
        await collectSiteDebts.dailySuspendedDebt(1);
        expect(Sentry.captureException.calledOnce).to.be.true;
      });
    });

    describe('on statuses other than suspended', async () => {
      beforeEach(async () => {
        sinon.spy(objectBotRequests, 'sendCustomJson');
        const status = _.sample(Object.values(_.omit(STATUSES, ['SUSPENDED'])));
        await AppFactory.Create({
          host: `${faker.random.string()}.${parent.host}`, status,
        });
      });
      it('should not call objectBotRequests', async () => {
        expect(objectBotRequests.sendCustomJson.called).to.be.false;
      });
    });
  });
});
