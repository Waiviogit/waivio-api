const {
  faker, chai, expect, dropDatabase, app, sinon, App,
} = require('test/testHelper');

const _ = require('lodash');
const { AppFactory } = require('test/factories');
const mocks = require('./mocks');

describe('On appController', async () => {
  describe('On show', async () => {
    describe('On success ', async () => {
      let currentApp, serviceBots, apiKey;
      beforeEach(async () => {
        await dropDatabase();
        serviceBots = mocks.serviceBots(5);
        currentApp = await AppFactory.Create({ bots: serviceBots });
        apiKey = faker.random.string(10);
        process.env.API_KEY = apiKey;
      });
      describe('Without api key in request', async () => {
        let result;
        beforeEach(async () => {
          result = await chai.request(app)
            .get(`/api/app/${currentApp.name}`)
            .set({ origin: currentApp.host });
        });
        it('should return status 200', async () => {
          expect(result).to.have.status(200);
        });
        it('should return correct app from request', async () => {
          expect(_.pick(currentApp, ['name', 'admins', 'daily_chosen_post'])).to.be.deep.eq(
            _.pick(result.body, ['name', 'admins', 'daily_chosen_post']),
          );
        });
        it('should not return service bots without api key in request', async () => {
          expect(result.body.service_bots).to.be.undefined;
        });
      });
      describe('With api key in request', async () => {
        let result;
        beforeEach(async () => {
          result = await chai.request(app)
            .get(`/api/app/${currentApp.name}`)
            .set({ 'api-key': apiKey, host: currentApp.host });
        });
        it('should return status 200', async () => {
          expect(result).to.have.status(200);
        });
        it('should return service bots in request', async () => {
          expect(result.body.service_bots).to.be.deep.eq(serviceBots);
        });
      });
    });
    describe('On errors', async () => {
      describe('Not found errors', async () => {
        let result;
        beforeEach(async () => {
          result = await chai.request(app)
            .get(`/api/app/${faker.random.string()}`)
        });
        it('should return 404 status if app not found', async () => {
          expect(result).to.have.status(404);
        });
        it('should return not found message if app not found', async () => {
          const regExp = /not found/;
          expect(regExp.test(result.body.message.toLowerCase())).to.be.true;
        });
      });
      describe('On database errors', async () => {
        let result, errorString;
        beforeEach(async () => {
          errorString = 'test Error';
          sinon.stub(App, 'findOne').throws({ message: errorString });
          result = await chai.request(app)
            .get(`/api/app/${faker.random.string()}`);
        });
        afterEach(async () => {
          sinon.restore();
        });
        it('should return 500 status', async () => {
          expect(result).to.have.status(500);
        });
        it('should return message which return database method', async () => {
          expect(result.body.message).to.be.eq(errorString);
        });
      });
    });
  });

  describe('On experts', async () => {

  });
  describe('On hashtags', async () => {

  });
});
