const {
  faker, chai, expect, dropDatabase, app, sinon, App, _, ObjectID, moment,
} = require('test/testHelper');
const authoriseUser = require('utilities/authorization/authoriseUser');
const { AppFactory } = require('test/factories');

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
      it('should create app with correct host', async () => {
        expect(myApp).to.be.exist;
      });
      it('should create app with correct inherited and canBeExtended flags', async () => {
        expect(myApp.inherited && !myApp.canBeExtended).to.be.true;
      });
      it('should create app with correct parent id', async () => {
        expect(myApp.parent.toString()).to.be.eq(parent._id.toString());
      });
      it('should add to app parent configuration', async () => {
        expect(myApp.configuration.configurationFields)
          .to.be.deep.eq(parent.configuration.configurationFields);
      });
      it('should add to app parent ', async () => {
        expect(myApp.supported_object_types)
          .to.be.deep.eq(parent.supported_object_types);
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
});
