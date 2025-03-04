const {
  faker, chai, expect, dropDatabase, app, sinon, App, _, ObjectID,
  moment, User, WebsitePayments, Prefetch, AppModel,
} = require('test/testHelper');
const { getNamespace } = require('cls-hooked');
const authoriseUser = require('utilities/authorization/authoriseUser');
const { STATUSES, PAYMENT_TYPES, FEE } = require('constants/sitesConstants');
const {
  AppFactory, WebsitePaymentsFactory, UsersFactory, ObjectFactory, CampaignFactory, PrefetchFactory,
} = require('test/factories');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { CAMPAIGN_STATUSES } = require('constants/campaignsData');
const { SUPPORTED_CURRENCIES } = require('constants/common');
const sitesHelper = require('utilities/helpers/sitesHelper');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const { CATEGORY_ITEMS } = require('constants/sitesConstants');
const { MAIN_OBJECT_TYPES } = require('constants/wobjectsData');
const { configurationMock } = require('./mocks');

describe('On sitesController', async () => {
  let parent, owner, name, filters, configuration, session;
  beforeEach(async () => {
    owner = faker.random.string();
    name = faker.random.string();
    await dropDatabase();
    filters = {
      restaurant: { features: [faker.random.string()], cuisine: [faker.random.string()] },
      dish: { ingredients: [], cuisine: [faker.random.string()] },
    };
    configuration = configurationMock();
    parent = await AppFactory.Create({
      canBeExtended: true,
      inherited: false,
      filters,
      configuration,
      status: STATUSES.ACTIVE,
      supportedTypes: OBJECT_TYPES.RESTAURANT,
    });
    session = getNamespace('request-session');
    sinon.stub(session, 'get').returns(parent.host);
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('On create', async () => {
    beforeEach(async () => {
      sinon.stub(objectBotRequests, 'sendCustomJson').returns(Promise.resolve({ result: true }));
    });
    describe('On OK', async () => {
      let result;
      beforeEach(async () => {
        sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: true }));
        result = await chai.request(app)
          .put('/api/sites/create')
          .send({ owner, parentId: parent._id, name });
        await App.findOne({ host: `${name}.${parent.host}` });
      });
      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should send request for create app ', async () => {
        expect(objectBotRequests.sendCustomJson.calledOnce).to.be.true;
      });
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
        expect(result.body).to.be.deep.eq([{ host: userApp.host, id: userApp._id.toString() }]);
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

  describe('On configuration', async () => {
    let myApp;
    beforeEach(async () => {
      sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: true }));
      myApp = await AppFactory.Create({
        canBeExtended: false, inherited: true, parent: parent._id, host: `${name}.${parent.host}`, owner,
      });
    });
    describe('On get configurations', async () => {
      it('should return configuration list', async () => {
        const result = await chai.request(app).get(`/api/sites/configuration?host=${myApp.host}`);
        expect(result.body).to.be.deep.eq(myApp.configuration);
      });
      it('should return 404 status if not find app', async () => {
        const result = await chai.request(app).get(`/api/sites/configuration?host=${faker.random.string()}`);
        expect(result).to.have.status(404);
      });
    });

    describe('On save configurations', async () => {
      describe('On OK', async () => {
        let result, object;
        beforeEach(async () => {
          object = await ObjectFactory.Create();
          const configToUpdate = _.cloneDeep(configuration);
          configToUpdate.aboutObject = object.author_permlink;
          result = await chai.request(app).post('/api/sites/configuration')
            .send({ host: myApp.host, userName: owner, configuration: configToUpdate });
        });
        it('should return status 200', async () => {
          expect(result).to.have.status(200);
        });
        it('should return updated configuration', async () => {
          expect(result.body.aboutObject).to.be.not.deep.eq(configuration.aboutObject);
        });
        it('should return all keys', async () => {
          configuration.aboutObject = object.author_permlink;
          expect(_.omit(result.body, ['configurationFields'])).to.have.all.keys(configuration.configurationFields);
        });
      });
      describe('On errors', async () => {
        it('should return 422 with not all config fields', async () => {
          const result = await chai.request(app).post('/api/sites/configuration')
            .send({ host: myApp.host, userName: owner, configuration: _.omit(configuration, ['desktopLogo']) });
          expect(result).to.have.status(422);
        });
        it('should return 422 with not fields in colors', async () => {
          configuration.colors = _.omit(configuration.colors, ['hover']);
          const result = await chai.request(app).post('/api/sites/configuration')
            .send({ host: myApp.host, userName: owner, configuration });
          expect(result).to.have.status(422);
        });
        it('should return 422 status with not exist object', async () => {
          const result = await chai.request(app).post('/api/sites/configuration')
            .send({ host: myApp.host, userName: owner, configuration });
          expect(result).to.have.status(422);
        });
      });
    });
  });

  describe('Requests with many apps(manage, report)', async () => {
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
        name: owner,
        amount: debt,
        type: PAYMENT_TYPES.WRITE_OFF,
        host: activeApp.host,
        countUsers: _.random(100, 150),
      });
      payment = await WebsitePaymentsFactory.Create({
        name: owner, amount: debt, type: PAYMENT_TYPES.WRITE_OFF, host: inactiveApp.host,
      });
    });

    describe('on ManagePage', async () => {
      let result;
      beforeEach(async () => {
        result = await chai.request(app).get(`/api/sites/manage?userName=${owner}`);
      });
      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should return correct apps', async () => {
        const hosts = _.map(result.body.websites, (site) => `${site.name}.${site.parent}`);
        expect(hosts).to.be.deep.eq([inactiveApp.host, activeApp.host, pendingApp.host]);
      });
      it('should return correct average dau of pending site', async () => {
        const foundApp = _.find(
          result.body.websites,
          { name: pendingApp.name, status: STATUSES.PENDING },
        );
        expect(foundApp.averageDau).to.be.eq(0);
      });
      it('should return correct average dau of active site', async () => {
        const foundApp = _.find(
          result.body.websites,
          { name: activeApp.name, status: STATUSES.ACTIVE },
        );
        expect(foundApp.averageDau).to.be.eq(activePayment.countUsers);
      });
      it('should return correct average dau of inactive site', async () => {
        const foundApp = _.find(
          result.body.websites,
          { name: inactiveApp.name, status: STATUSES.INACTIVE },
        );
        expect(foundApp.averageDau).to.be.eq(payment.countUsers);
      });
      it('should return correct average DAU', async () => {
        expect(result.body.accountBalance.avgDau)
          .to.be.eq(Math.trunc(payment.countUsers + activePayment.countUsers));
      });
      it('should return correct pay data', async () => {
        expect(result.body.accountBalance.paid).to.be.eq(amount - debt * 2);
      });
      it('should return correct dataForPayments', async () => {
        const user = await User.findOne({ name: FEE.account }).lean();
        const fields = _.pick(user, ['name', 'json_metadata', 'posting_json_metadata', 'alias', '_id', 'objects_following_count']);
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
            .to.be.deep.eq([inactiveApp.host, activeApp.host, pendingApp.host]);
        });
        it('should return correct dataForPayments at report', async () => {
          const user = await User.findOne({ name: FEE.account }).lean();
          const fields = _.pick(user, ['name', 'json_metadata', 'posting_json_metadata', 'alias', '_id', 'objects_following_count']);
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
          const payments = _.filter(
            result.body.payments,
            (pmnt) => pmnt.type === PAYMENT_TYPES.TRANSFER,
          );
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

  describe('On authorities(moderators, admins, authorities)', async () => {
    let userApp, authorities, result;
    beforeEach(async () => {
      authorities = [];
      for (let num = 0; num <= _.random(5, 10); num++) {
        const userName = faker.random.string();
        authorities.push(userName);
        await UsersFactory.Create({ name: userName });
      }
      userApp = await AppFactory.Create({
        parent: parent._id,
        host: `${faker.random.string()}.${parent.host}`,
        authority: authorities,
      });
      sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: 'ok' }));
      result = await chai.request(app).get(`/api/sites/authorities?userName=${userApp.owner}&host=${userApp.host}`);
    });
    it('should return correct authorities', async () => {
      expect(_.sortBy(_.map(result.body, 'name'))).to.be.deep.eq(_.sortBy(authorities));
    });
    it('should return correct authorities length', async () => {
      expect(result.body.length).to.be.eq(authorities.length);
    });
    it('should result items with all keys', async () => {
      expect(result.body[0]).to.have.all.keys(['name', '_id', 'json_metadata', 'posting_json_metadata', 'alias', 'objects_following_count', 'wobjects_weight']);
    });
    it('should return 404 status if host not found', async () => {
      result = await chai.request(app).get(`/api/sites/authorities?userName=${userApp.owner}&host=${faker.random.string()}`);
      expect(result).to.have.status(404);
    });
  });

  describe('On getObjectFilters', async () => {
    let userApp, result;
    beforeEach(async () => {
      sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: 'ok' }));
      const host = `${faker.random.string()}.${parent.host}`;
      userApp = await AppFactory.Create({ parent: parent._id, owner, host });
      result = await chai.request(app).get(`/api/sites/filters?userName=${owner}&host=${host}`);
    });
    it('should return status 200', async () => {
      expect(result).to.have.status(200);
    });
    it('should return correct responce', async () => {
      expect(result.body).to.be.deep.eq(userApp.object_filters);
    });
    it('should return 404 if user not owner in app', async () => {
      result = await chai.request(app).get(`/api/sites/filters?userName=${faker.random.string()}&host=${userApp.host}`);
      expect(result).to.have.status(404);
    });
  });

  describe('On saveObjectFilters', async () => {
    let host;
    beforeEach(async () => {
      sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: 'ok' }));
      host = `${faker.random.string()}.${parent.host}`;

      await AppFactory.Create({
        owner, parent: parent._id, host,
      });
    });
    describe('On OK', async () => {
      let result, tag;
      beforeEach(async () => {
        tag = faker.random.string();
        filters.restaurant.cuisine.push(tag);
        result = await chai.request(app)
          .post('/api/sites/filters')
          .send({ userName: owner, host, objectsFilter: filters });
      });
      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should update correct tagCategory', async () => {
        expect(result.body.restaurant.cuisine).to.include(tag);
      });
    });
    describe('On error', async () => {
      it('should return 422 status with not full top level filters', async () => {
        const result = await chai.request(app)
          .post('/api/sites/filters')
          .send({ userName: owner, host, objectsFilter: _.omit(filters, ['restaurant']) });
        expect(result).to.have.status(422);
      });
      it('should return 422 status with not full teg categories', async () => {
        filters.restaurant = _.omit(filters.restaurant, ['cuisine']);
        const result = await chai.request(app)
          .post('/api/sites/filters')
          .send({ userName: owner, host, objectsFilter: filters });
        expect(result).to.have.status(422);
      });
    });
  });

  describe('On save mapCoordinates', async () => {
    let host, mapCoordinates;
    beforeEach(async () => {
      sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: 'ok' }));
      host = `${faker.random.string()}.${parent.host}`;
      sinon.spy(sitesHelper, 'updateSupportedObjects');
      await AppFactory.Create({
        owner, parent: parent._id, host,
      });
      mapCoordinates = [{
        topPoint: [+faker.address.longitude(), +faker.address.latitude()],
        bottomPoint: [+faker.address.longitude(), +faker.address.latitude()],
        center: [+faker.address.longitude(), +faker.address.latitude()],
        zoom: faker.random.number(),
      }];
    });
    afterEach(() => {
      sinon.restore();
    });
    describe('On OK', async () => {
      let result;
      beforeEach(async () => {
        result = await chai.request(app)
          .put('/api/sites/map')
          .send({ userName: owner, host, mapCoordinates });
      });
      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should save coordinates to app', async () => {
        const updatedApp = await App.findOne({ host }).lean();
        expect(updatedApp.mapCoordinates).to.be.deep.eq(mapCoordinates);
      });
      it('should should call update supported objects method', async () => {
        expect(sitesHelper.updateSupportedObjects.calledOnce).to.be.true;
      });
    });

    describe('On Error', async () => {
      it('should return 404 status with incorrect host', async () => {
        const result = await chai.request(app)
          .put('/api/sites/map')
          .send({ userName: owner, host: faker.random.string(), mapCoordinates });
        expect(result).to.have.status(404);
      });
      it('should not update app with incorrect host', async () => {
        await chai.request(app)
          .put('/api/sites/map')
          .send({ userName: owner, host: faker.random.string(), mapCoordinates });
        const result = await App.findOne({ host }).lean();
        expect(result.mapCoordinates).to.have.length(0);
      });
    });
  });

  describe('On main sites map', async () => {
    let wobj1, wobj2, campaign;
    beforeEach(async () => {
      wobj1 = await ObjectFactory.Create({ objectType: OBJECT_TYPES.RESTAURANT, map: { type: 'Point', coordinates: [-94.233, 48.224] } });
      wobj2 = await ObjectFactory.Create({ objectType: OBJECT_TYPES.RESTAURANT, map: { type: 'Point', coordinates: [-95.233, 48.224] } });
      campaign = await CampaignFactory.Create({
        status: CAMPAIGN_STATUSES.ACTIVE,
        requiredObject: wobj1.author_permlink,
        activation_permlink: faker.random.string(),
        objects: [wobj2.author_permlink],
      });
    });
    describe('for parent', async () => {
      it('should return two objects for parent if they in box', async () => {
        const result = await chai.request(app)
          .post('/api/sites/map')
          .send({ topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] });
        expect(result.body.wobjects).to.have.length(2);
      });
      it('should not return one of object in it not in box', async () => {
        const result = await chai.request(app)
          .post('/api/sites/map')
          .send({ topPoint: [-94.235, 48.224], bottomPoint: [-91.233, 44.224] });
        expect(result.body.wobjects).to.have.length(1);
      });
      it('should return primary campaign for object if it exist', async () => {
        const result = await chai.request(app)
          .post('/api/sites/map')
          .send({ topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] });
        const wobj = _.find(result.body.wobjects, { author_permlink: wobj1.author_permlink });
        expect(wobj.campaigns).to.be.deep.eq({
          min_reward: campaign.reward, max_reward: campaign.reward,
        });
      });
      it('should return secondary campaign if it exist', async () => {
        const result = await chai.request(app)
          .post('/api/sites/map')
          .send({ topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] });
        const wobj = _.find(result.body.wobjects, { author_permlink: wobj2.author_permlink });
        expect(wobj.propositions).to.be.exist;
      });
    });
    describe('for sites', async () => {
      let host;
      beforeEach(async () => {
        host = `${faker.random.string()}.${parent.host}`;
        sinon.spy(sitesHelper, 'updateSupportedObjects');
        await AppFactory.Create({
          owner,
          parent: parent._id,
          host,
          supportedObjects: [wobj1.author_permlink, wobj2.author_permlink],
          status: STATUSES.ACTIVE,
        });
      });
      it('should return all wobjects if they in search box and in site supported objects ', async () => {
        sinon.restore();
        sinon.stub(session, 'get').returns(host);
        const result = await chai.request(app)
          .post('/api/sites/map')
          .send({ topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] });
        expect(result.body.wobjects).to.have.length(2);
      });
      it('should not return object if it not in supported objects', async () => {
        await App.updateOne({ host }, { supported_objects: [wobj1.author_permlink] });
        sinon.restore();
        sinon.stub(session, 'get').returns(host);
        const result = await chai.request(app)
          .post('/api/sites/map')
          .send({ topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] });
        const wobj = _.find(result.body.wobjects, { author_permlink: wobj2.author_permlink });
        expect(wobj).to.be.undefined;
      });
    });
  });

  describe('On get settings', async () => {
    let userApp, result;
    beforeEach(async () => {
      userApp = await AppFactory.Create();
    });
    describe('On OK', async () => {
      beforeEach(async () => {
        result = await chai.request(app)
          .get('/api/sites/settings')
          .query({ host: userApp.host });
      });
      it('should response 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should response body to be deep eq app fields', async () => {
        const mock = {
          googleAnalyticsTag: userApp.googleAnalyticsTag,
          beneficiary: userApp.beneficiary,
          referralCommissionAcc: userApp.owner,
          currency: SUPPORTED_CURRENCIES.USD,
          language: userApp.language,
        };
        expect(result.body).to.be.deep.eq(mock);
      });
    });
    describe('On Error', async () => {
      it('should response 422', async () => {
        result = await chai.request(app)
          .get('/api/sites/settings');
        expect(result).to.have.status(422);
      });
      it('should response 404', async () => {
        result = await chai.request(app)
          .get('/api/sites/settings')
          .query({ host: faker.random.string() });
        expect(result).to.have.status(404);
      });
    });
  });

  describe('On get restrictions', async () => {
    let userApp, result;
    beforeEach(async () => {
      userApp = await AppFactory.Create();
    });
    describe('On OK', async () => {
      beforeEach(async () => {
        sinon.stub(authoriseUser, 'authorise').returns(Promise.resolve({ result: 'ok' }));
        result = await chai.request(app)
          .get('/api/sites/restrictions')
          .query({ userName: faker.random.string(), host: userApp.host })
          .set({ Origin: userApp.host });
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should response 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should response body have all keys', async () => {
        expect(result.body).to.have.all.keys(['mutedUsers', 'blacklistUsers', 'mutedCount', 'blacklistedCount']);
      });
    });
    describe('On Error', async () => {
      it('should response 422', async () => {
        result = await chai.request(app)
          .get('/api/sites/restrictions');
        expect(result).to.have.status(422);
      });
      it('should response 401', async () => {
        result = await chai.request(app)
          .get('/api/sites/restrictions')
          .query({ userName: faker.random.string(), host: userApp.host });
        expect(result).to.have.status(401);
      });
    });
  });

  describe('On prefetches', async () => {
    describe('on show', async () => {
      let prefetch;
      const count = _.random(1, 10);
      const type = _.sample(['restaurant', 'dish']);
      beforeEach(async () => {
        await dropDatabase();
        for (let i = 0; i < count; i++) {
          await PrefetchFactory.Create({ type });
        }
        prefetch = await PrefetchFactory.Create({ type: 'drink' });
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should return the correct prefetch count (all)', async () => {
        const result = await chai.request(app)
          .get(`/api/sites/all-prefetches?types=${type}`);
        expect(result.body).to.have.length(count);
      });
      it('should return all the generated prefetches and one that was created separately', async () => {
        const result = await chai.request(app)
          .get(`/api/sites/all-prefetches?types=${type},drink`);
        expect(result.body).to.have.length(count + 1);
      });
      it('should return prefetches of the correct type', async () => {
        const result = await chai.request(app)
          .get(`/api/sites/all-prefetches?types=${type}`);
        expect(_.map(result.body, name)).to.be.not.include(prefetch.name);
      });
    });

    describe('On get prefetches by app and update prefetches list in app', async () => {
      let myApp, prefetch1, prefetch2, result;
      beforeEach(async () => {
        await dropDatabase();
        myApp = await AppFactory.Create({
          status: STATUSES.ACTIVE, owner, admins: [owner],
        });
        sinon.restore();
        sinon.stub(session, 'get').returns(myApp.host);
        sinon.stub(authoriseUser, 'authorise').returns({});
        prefetch1 = await PrefetchFactory.Create({ type: 'restaurant' });
        prefetch2 = await PrefetchFactory.Create({ type: 'dish' });
        result = await chai.request(app).put('/api/sites/prefetch')
          .send({ names: [prefetch1.name, prefetch2.name] })
          .set({ userName: owner });
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should return list of added prefetches', async () => {
        expect(result.body).to.be.deep.eq({ names: [prefetch1.name, prefetch2.name] });
      });
      it('should have added prefetches to the app', async () => {
        const { result: application } = await AppModel.findOne({ name: myApp.name });
        expect(application.prefetches).to.be.deep.eq([prefetch1.name, prefetch2.name]);
      });
      it('On get. Should return prefetches by app', async () => {
        const res = await chai.request(app)
          .get(`/api/sites/prefetch?types=${prefetch1.type}`);
        expect(res.body[0].name).to.be.eq(prefetch1.name);
      });
      it('Should return prefetches by app and many types', async () => {
        const res = await chai.request(app)
          .get(`/api/sites/prefetch?types=${prefetch1.type},${prefetch2.type}`);
        expect(_.map(res.body, 'name')).to.have.all.members([prefetch1.name, prefetch2.name]);
      });
    });

    describe('On create', async () => {
      let data, result;
      beforeEach(async () => {
        await dropDatabase();
        data = {
          name: faker.random.string(10),
          tag: faker.random.string(),
          type: _.sample(MAIN_OBJECT_TYPES),
          category: _.sample(CATEGORY_ITEMS),
        };
        result = await chai.request(app).post(`/api/sites/prefetch?type=${data.type}`).send(data);
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should return new prefetch', async () => {
        expect(result.body.name).to.be.eq(data.name);
      });
      it('should have created a new prefetch', async () => {
        const { result: prefetch } = await Prefetch.findOne({ name: data.name, type: data.type });
        expect(prefetch).to.be.exist;
      });
    });
  });
});
