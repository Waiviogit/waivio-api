const _ = require('lodash');
const { ObjectFactory } = require('test/factories');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { dropDatabase, expect } = require('test/testHelper');
const { countWobjectsByArea } = require('models/wObjectModel');

describe('Wobject Model', async () => {
  beforeEach(async () => {
    await dropDatabase();
  });
  describe('On countWobjectsByArea', async () => {
    const objectType = _.sample(['restaurant', 'dish', 'drink']);
    const countVacouverWobjects = _.random(1, 50);
    const countRichmondWobjects = _.random(1, 50);
    const countPentictonWobjects = _.random(1, 50);
    beforeEach(async () => {
      await dropDatabase();
      for (let i = 0; i < countVacouverWobjects; i++) {
        await ObjectFactory.Create({
          fields: [{ name: FIELDS_NAMES.ADDRESS, body: '{"city":"Vancouver","country":"Canada"}' }], objectType,
        });
      }
      for (let i = 0; i < countRichmondWobjects; i++) {
        await ObjectFactory.Create({
          fields: [{ name: FIELDS_NAMES.ADDRESS, body: '{"city":"Richmond","country":"Canada"}' }], objectType,
        });
      }
      for (let i = 0; i < countPentictonWobjects; i++) {
        await ObjectFactory.Create({
          fields: [{ name: FIELDS_NAMES.ADDRESS, body: '{"city":"Penticton","country":"Canada"}' }], objectType,
        });
      }
    });
    it('should return an array of cities with correct counters', async () => {
      const { result } = await countWobjectsByArea({
        objectType, cities: ['Vancouver', 'Richmond'],
      });
      expect(result).to.be.deep.eq([
        { city: 'Vancouver', counter: countVacouverWobjects },
        { city: 'Richmond', counter: countRichmondWobjects },
      ]);
    });
    it('should return an error if cities were not specified', async () => {
      const { error } = await countWobjectsByArea({
        objectType, cities: [],
      });
      expect(error).to.be.deep.eq({ status: 404, message: 'Cities not specified!' });
    });
    it('should return objects that match the crucialWobjects', async () => {
      const crucialWobject = await ObjectFactory.Create({
        fields: [{ name: FIELDS_NAMES.ADDRESS, body: '{"city":"Vancouver","country":"Canada"}' }], objectType,
      });
      const { result } = await countWobjectsByArea({
        objectType, cities: ['Vancouver'], crucialWobjects: [crucialWobject.author_permlink],
      });
      expect(result).to.have.length(1);
    });
  });
});
