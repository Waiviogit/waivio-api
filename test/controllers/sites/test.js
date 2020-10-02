const {
  faker, chai, expect, dropDatabase, app, sinon, App, _, ObjectID, moment, User, WebsitePayments,
} = require('test/testHelper');
const authoriseUser = require('utilities/authorization/authoriseUser');
const { STATUSES, PAYMENT_TYPES, FEE } = require('constants/sitesConstants');
const { AppFactory, WebsitePaymentsFactory, UsersFactory } = require('test/factories');
const objectBotRequests = require('utilities/requests/objectBotRequests');

describe('On sitesController', async () => {
  let parent, owner, name;
  beforeEach(async () => {
    owner = faker.random.string();
    name = faker.random.string();
    await dropDatabase();
    parent = await AppFactory.Create({ canBeExtended: true, inherited: false });
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('On create', async () => {
    beforeEach(async () => {
      sinon.stub(objectBotRequests, 'sendCustomJson').returns(Promise.resolve({ result: true }));
    });
    describe('On OK', async () => {
      let result, myApp;
      beforeEach(async () => {
        sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: true }));
        result = await chai.request(app)
          .put('/api/sites/create')
          .send({ owner, parentId: parent._id, name });
        myApp = await App.findOne({ host: `${name}.${parent.host}` });
      });
      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should send request for create app ', async () => {
        expect(objectBotRequests.sendCustomJson.calledOnce).to.be.true;
      });
      // it('should create app with correct inherited and canBeExtended flags', async () => {
      //   expect(myApp.inherited && !myApp.canBeExtended).to.be.true;
      // });
      // it('should create app with correct parent id', async () => {
      //   expect(myApp.parent.toString()).to.be.eq(parent._id.toString());
      // });
      // it('should add to app parent configuration', async () => {
      //   expect(myApp.configuration.configurationFields)
      //     .to.be.deep.eq(parent.configuration.configurationFields);
      // });
      // it('should add to app parent ', async () => {
      //   expect(myApp.supported_object_types)
      //     .to.be.deep.eq(parent.supported_object_types);
      // });
    });
    describe('On ERROR', async () => {
      describe('On authorise error', async () => {
        let result;
        beforeEach(async () => {
          sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({
            error: {
              status: 401,
              message: 'Token not valid!',
            },
          }));
          result = await chai.request(app)
            .put('/api/sites/create')
            .send({ owner, parentId: parent._id, name });
        });
        it('should return 401 status', async () => {
          expect(result).to.have.status(401);
        });
        it('should not create app', async () => {
          const myApp = await App.findOne({ host: `${name}.${parent.host}` });
          expect(myApp).to.be.null;
        });
      });
      describe('On validation error', async () => {
        beforeEach(async () => {
          sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: true }));
          await AppFactory.Create({
            canBeExtended: true, inherited: false, parent: parent._id, host: `${name}.${parent.host}`,
          });
        });
        it('should return 409 if name already exist', async () => {
          const result = await chai.request(app)
            .put('/api/sites/create')
            .send({ owner, parentId: parent._id, name });
          expect(result).to.have.status(409);
        });
        it('should return 404 if parent not exist', async () => {
          const result = await chai.request(app)
            .put('/api/sites/create')
            .send({ owner, parentId: new ObjectID(), name });
          expect(result).to.have.status(404);
        });
        it('should not create without name', async () => {
          const result = await chai.request(app)
            .put('/api/sites/create')
            .send({ owner, parentId: new ObjectID() });
          expect(result).to.have.status(422);
        });
      });
    });
  });

  describe('On parentList', async () => {
    let result;
    beforeEach(async () => {
      result = await chai.request(app).get('/api/sites/getParents');
    });
    it('should return status 200', async () => {
      expect(result).to.have.status(200);
    });
    it('should return correct response', async () => {
      expect(result.body).to.be.deep.eq([{ domain: parent.host, _id: parent._id.toString() }]);
    });
  });

  describe('On getUserApps', async () => {
    let userApp;
    beforeEach(async () => {
      userApp = await AppFactory.Create({ parent: parent._id, host: `${faker.random.string()}.${parent.host}` });
    });
    describe('On OK', async () => {
      let result;
      beforeEach(async () => {
        sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: 'ok' }));
        result = await chai.request(app).get(`/api/sites?userName=${userApp.owner}`);
      });
      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should return user apps', async () => {
        expect(result.body).to.be.deep.eq([userApp.host]);
      });
      it('should not return error if user not has created apps', async () => {
        result = await chai.request(app).get(`/api/sites?userName=${faker.name.firstName()}`);
        expect(result.body).to.be.deep.eq([]);
      });
      it('should not return user app, which was deactivated > 6 month ago', async () => {
        const host = `${faker.random.string()}.${parent.host}`;
        await AppFactory.Create({
          parent: parent._id,
          host,
          deactivatedAt: moment.utc().subtract(7, 'month').toDate(),
        });
        result = await chai.request(app).get(`/api/sites?userName=${userApp.owner}`);
        expect(result.body).to.not.include(host);
      });
    });
    describe('On error', async () => {
      describe('On authorise error', async () => {
        let result;
        beforeEach(async () => {
          sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({
            error: {
              status: 401,
              message: 'Token not valid!',
            },
          }));
          result = await chai.request(app).get(`/api/sites?userName=${userApp.owner}`);
        });
        it('should return 401 status', async () => {
          expect(result).to.have.status(401);
        });
      });
      describe('On validation error', async () => {
        beforeEach(async () => {
          sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: 'ok' }));
        });
        it('should return 422 error withou user in request', async () => {
          const result = await chai.request(app).get('/api/sites');
          expect(result).to.have.status(422);
        });
      });
    });
  });

  describe('On configurationsList', async () => {
    let myApp;
    beforeEach(async () => {
      myApp = await AppFactory.Create({
        canBeExtended: true, inherited: false, parent: parent._id, host: `${name}.${parent.host}`,
      });
    });
    it('should return configuration list', async () => {
      const result = await chai.request(app).get(`/api/sites/getConfigurationsList?host=${myApp.host}`);
      expect(result.body).to.be.deep.eq(myApp.configuration.configurationFields);
    });
    it('should return 404 status if not find app', async () => {
      const result = await chai.request(app).get(`/api/sites/getConfigurationsList?host=${faker.random.string()}`);
      expect(result).to.have.status(404);
    });
  });

  describe('Request with many apps', async () => {
    let pendingApp, activeApp, inactiveApp, amount, debt, payment, activePayment;
    beforeEach(async () => {
      await UsersFactory.Create({ name: FEE.account });
      sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: 'ok' }));
      amount = _.random(20, 50);
      debt = _.random(1, 2);
      const appName = faker.random.string();
      pendingApp = await AppFactory.Create({
        parent: parent._id, owner, host: `${appName}.${parent.host}`, name: appName,
      });
      const activeName = faker.random.string();
      activeApp = await AppFactory.Create({
        parent: parent._id,
        owner,
        name: activeName,
        host: `${activeName}.${parent.host}`,
        activatedAt: moment.utc().toDate(),
        status: STATUSES.ACTIVE,
      });
      const inactiveName = faker.random.string();
      inactiveApp = await AppFactory.Create({
        parent: parent._id,
        owner,
        name: inactiveName,
        host: `${inactiveName}.${parent.host}`,
        deactivatedAt: moment.utc().toDate(),
        status: STATUSES.INACTIVE,
      });
      await WebsitePaymentsFactory.Create({ name: owner, amount });
      activePayment = await WebsitePaymentsFactory.Create({
        name: owner, amount: debt, type: PAYMENT_TYPES.WRITE_OFF, host: activeApp.host, countUsers: _.random(100, 150),
      });
      payment = await WebsitePaymentsFactory.Create({
        name: owner, amount: debt, type: PAYMENT_TYPES.WRITE_OFF, host: inactiveApp.host,
      });
    });

    describe('on ManagePage', async () => {
      let result;
      beforeEach(async () => {
        result = await chai.request(app).get(`/api/sites/managePage?userName=${owner}`);
      });
      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should return correct apps', async () => {
        const hosts = _.map(result.body.websites, (site) => `${site.name}.${site.parent}`);
        expect(hosts).to.be.deep.eq([pendingApp.host, activeApp.host, inactiveApp.host]);
      });
      it('should return correct average dau of pending site', async () => {
        const foundApp = _.find(result.body.websites,
          { name: pendingApp.name, status: STATUSES.PENDING });
        expect(foundApp.averageDau).to.be.eq(0);
      });
      it('should return correct average dau of active site', async () => {
        const foundApp = _.find(result.body.websites,
          { name: activeApp.name, status: STATUSES.ACTIVE });
        expect(foundApp.averageDau).to.be.eq(activePayment.countUsers);
      });
      it('should return correct average dau of inactive site', async () => {
        const foundApp = _.find(result.body.websites,
          { name: inactiveApp.name, status: STATUSES.INACTIVE });
        expect(foundApp.averageDau).to.be.eq(payment.countUsers);
      });
      it('should return correct average DAU', async () => {
        expect(result.body.accountBalance.avgDau)
          .to.be.eq(Math.trunc(_.mean([payment.countUsers, activePayment.countUsers, 0])));
      });
      it('should return correct pay data', async () => {
        expect(result.body.accountBalance.paid).to.be.eq(amount - debt * 2);
      });
      it('should return correct dataForPayments', async () => {
        const user = await User.findOne({ name: FEE.account }).lean();
        const fields = _.pick(user, ['name', 'json_metadata', 'posting_json_metadata', 'alias', '_id']);
        fields._id = fields._id.toString();
        expect(result.body.dataForPayments).to.be.deep.eq({ user: fields, memo: FEE.id });
      });
    });

    describe('on Report', async () => {
      beforeEach(async () => {
      });
      describe('with exist payments without host and date sort', async () => {
        let result;
        beforeEach(async () => {
          result = await chai.request(app).get(`/api/sites/report?userName=${owner}`);
        });
        it('should return status 200', async () => {
          expect(result).to.have.status(200);
        });
        it('should return correct balance', async () => {
          expect(result.body.payments[0].balance)
            .to.be.eq(amount - activePayment.amount - payment.amount);
        });
        it('should return correct payments length', async () => {
          expect(result.body.payments.length).to.be.eq(3);
        });
        it('should return correct ownerAppNames', async () => {
          expect(result.body.ownerAppNames)
            .to.be.deep.eq([pendingApp.host, activeApp.host, inactiveApp.host]);
        });
        it('should return correct dataForPayments at report', async () => {
          const user = await User.findOne({ name: FEE.account }).lean();
          const fields = _.pick(user, ['name', 'json_metadata', 'posting_json_metadata', 'alias', '_id']);
          fields._id = fields._id.toString();
          expect(result.body.dataForPayments).to.be.deep.eq({ user: fields, memo: FEE.id });
        });
      });
      describe('With host, and without dates', async () => {
        let result;
        beforeEach(async () => {
          result = await chai.request(app).get(`/api/sites/report?userName=${owner}&host=${activeApp.host}`);
        });
        it('should not return transfer payments', async () => {
          const payments = _.filter(result.body.payments,
            (pmnt) => pmnt.type === PAYMENT_TYPES.TRANSFER);
          expect(payments).to.have.length(0);
        });
        it('should return only payments for required host', async () => {
          const dbPayments = await WebsitePayments.find({ host: activeApp.host });
          expect(result.body.payments).to.have.length(dbPayments.length);
        });
      });
      describe('with date and without host', async () => {
        let oldPayment;
        beforeEach(async () => {
          oldPayment = await WebsitePaymentsFactory.Create({
            name: owner,
            amount: debt,
            type: PAYMENT_TYPES.WRITE_OFF,
            host: inactiveApp.host,
            createdAt: moment.utc().subtract(10, 'day').toDate(),
          });
        });
        describe('without host', async () => {
          it('should not return old payment with start date', async () => {
            const result = await chai.request(app)
              .get(`/api/sites/report?userName=${owner}&startDate=${moment(moment.utc().subtract(5, 'day')).unix()}`);
            const oldData = _.find(result.body.payments, { _id: oldPayment._id });
            expect(oldData).to.be.undefined;
          });
          it('should return 422 status with start date > endDate', async () => {
            const result = await chai.request(app)
              .get(`/api/sites/report?userName=${owner}
              &startDate=${moment(moment.utc().subtract(5, 'day')).unix()}
              &endDate=${moment(moment.utc().subtract(6, 'day')).unix()}`);
            expect(result).to.have.status(422);
          });
          it('should return only old payment with oldDate', async () => {
            const result = await chai.request(app)
              .get(`/api/sites/report?userName=${owner}&endDate=${moment(moment.utc().subtract(6, 'day')).unix()}`);
            const oldData = _.filter(result.body.payments, { host: oldPayment.host });
            expect(result.body.payments).to.be.deep.eq(oldData);
          });
        });
        describe('with host', async () => {
          let result;
          beforeEach(async () => {
            result = await chai.request(app)
              .get(`/api/sites/report?userName=${owner}&host=${inactiveApp.host}&startDate=${moment(moment.utc().subtract(5, 'day')).unix()}`);
          });
          it('should return only one record for inactive host', async () => {
            expect(result.body.payments).to.have.length(1);
          });
          it('should not return old record for inactive app', async () => {
            const record = _.find(result.body.payments, { _id: oldPayment._id.toString() });
            expect(record).to.be.undefined;
          });
          it('should return correct record for inactive app', async () => {
            const record = _.filter(result.body.payments, { _id: payment._id.toString() });
            expect(result.body.payments).to.be.deep.eq(record);
          });
        });
      });
    });
  });
});
