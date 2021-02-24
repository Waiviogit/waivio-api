const {
  faker, chai, expect, dropDatabase, app, sinon, GeoIp,
} = require('test/testHelper');
const ipRequest = require('utilities/requests/ipRequest');
const { GeoIpFactory } = require('test/factories');
const _ = require('lodash');

describe('On userController', async () => {
  let result;
  beforeEach(async () => {
    await dropDatabase();
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('On getGeoByIp', async () => {
    const ip = faker.internet.ip();
    describe('when can\'t find by ip', async () => {
      const mockZeroLatLon = { longitude: 0, latitude: 0 };

      it('should return status 200', async () => {
        result = await chai.request(app).get('/api/geo-ip');
        expect(result).to.have.status(200);
      });

      it('should return 0 longitude if there is no ip', async () => {
        result = await chai.request(app).get('/api/geo-ip');
        expect(result.body).to.be.deep.eq(mockZeroLatLon);
      });

      it('should return 0 longitude if there is no record in db and no record on api', async () => {
        sinon.stub(ipRequest, 'getIp').returns(Promise.resolve({}));
        result = await chai.request(app).get('/api/geo-ip').set({ 'x-real-ip': ip });
        expect(result.body).to.be.deep.eq(mockZeroLatLon);
      });
    });

    describe('When no ip in db, but geo api has one', async () => {
      const reqMock = {
        geoData: { lat: faker.address.latitude(), lon: faker.address.longitude() },
      };
      const parsedReqMock = {
        latitude: parseFloat(reqMock.geoData.lat),
        longitude: parseFloat(reqMock.geoData.lon),
      };

      beforeEach(async () => {
        sinon.stub(ipRequest, 'getIp').returns(Promise.resolve(reqMock));
        result = await chai.request(app).get('/api/geo-ip').set({ 'x-real-ip': ip });
      });

      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });

      it('should return req mock longitude from request', async () => {
        expect(result.body).to.be.deep.eq(parsedReqMock);
      });

      it('should create record in DB from geo api request', async () => {
        const { latitude, longitude } = await GeoIp.findOne({ ip }).lean();
        expect(parsedReqMock).to.be.deep.eq({ latitude, longitude });
      });
    });

    describe('When record in db exists', async () => {
      let record;
      beforeEach(async () => {
        record = await GeoIpFactory.Create();
        result = await chai.request(app).get('/api/geo-ip').set({ 'x-real-ip': record.ip });
      });

      it('should return status 200', async () => {
        expect(result).to.have.status(200);
      });

      it('should return correct longitude and latitude', async () => {
        expect(result.body)
          .to.be.deep.eq({ latitude: record.latitude, longitude: record.longitude });
      });
    });
  });

  describe('On putUserGeo', async () => {
    const ip = faker.internet.ip();
    const longitude = parseFloat(faker.address.longitude());
    const latitude = parseFloat(faker.address.latitude());

    describe('On not valid data', async () => {
      it('should return 422 when no ip', async () => {
        result = await chai.request(app).put('/api/geo-ip').send({ longitude, latitude });
        expect(result).to.have.status(422);
      });

      it('should return 422 when no latitude', async () => {
        result = await chai.request(app).put('/api/geo-ip').set({ 'x-real-ip': ip }).send({ longitude });
        expect(result).to.have.status(422);
      });

      it('should return 422 when no longitude', async () => {
        result = await chai.request(app).put('/api/geo-ip').set({ 'x-real-ip': ip }).send({ latitude });
        expect(result).to.have.status(422);
      });

      it('should return 422 when incorrect latitude', async () => {
        result = await chai.request(app).put('/api/geo-ip').set({ 'x-real-ip': ip }).send({ latitude, longitude: _.random(181, 1000) });
        expect(result).to.have.status(422);
      });

      it('should return 422 when incorrect longitude', async () => {
        result = await chai.request(app).put('/api/geo-ip').set({ 'x-real-ip': ip }).send({ longitude, latitude: _.random(91, 1000) });
        expect(result).to.have.status(422);
      });
    });

    describe('On valid data', async () => {
      describe('if db didn\'t has record on ip create new and return result', async () => {
        beforeEach(async () => {
          result = await chai.request(app).put('/api/geo-ip').set({ 'x-real-ip': ip }).send({ longitude, latitude });
        });
        it('should return status 200', async () => {
          expect(result).to.have.status(200);
        });

        it('should has same latitude and longitude', async () => {
          expect(result.body).to.be.deep.eq({ longitude, latitude });
        });

        it('should create record in DB', async () => {
          const record = await GeoIp.findOne({ ip }).lean();
          expect({ latitude: record.latitude, longitude: record.longitude })
            .to.be.deep.eq({ latitude, longitude });
        });
      });

      describe('if db has record on ip', async () => {
        let record, updatedRecord;
        beforeEach(async () => {
          record = await GeoIpFactory.Create();
          result = await chai.request(app).put('/api/geo-ip').set({ 'x-real-ip': ip }).send({ longitude, latitude });
          updatedRecord = await GeoIp.findOne({ ip }).lean();
        });

        it('should return status 200', async () => {
          expect(result).to.have.status(200);
        });

        it('should updated record in DB has proper longitude and latitude', async () => {
          updatedRecord = await GeoIp.findOne({ ip }).lean();
          expect({ latitude: updatedRecord.latitude, longitude: updatedRecord.longitude })
            .to.be.deep.eq({ latitude, longitude });
        });

        it('should updated record should be different', async () => {
          updatedRecord = await GeoIp.findOne({ ip }).lean();
          expect(record).to.be.not.deep.eq(updatedRecord);
        });
      });
    });
  });
});
