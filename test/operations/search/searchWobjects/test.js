const {
  faker, expect, dropDatabase, _,
} = require('test/testHelper');
const { FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');

const { wobjects } = require('utilities/operations/search');

const { ObjectFactory } = require('test/factories');

describe('On wobjects search', async () => {
  beforeEach(async () => {
    await dropDatabase();
  });
  describe('On search with counters', async () => {
    let result;
    const counter = _.random(5, 10);
    const searchedType = _.sample(Object.values(OBJECT_TYPES));
    const notSearchedTypes = Object.values(OBJECT_TYPES);
    notSearchedTypes.splice(notSearchedTypes.indexOf(searchedType), 1);

    beforeEach(async () => {
      for (let i = 0; i < counter; i++) {
        await ObjectFactory.Create({
          objectType: searchedType,
          fields: [{ name: FIELDS_NAMES.NAME, body: faker.random.string() }],
        });
      }
      for (let i = 0; i < _.random(1, 3); i++) {
        await ObjectFactory.Create({
          objectType: _.sample(notSearchedTypes),
          fields: [{ name: FIELDS_NAMES.NAME, body: faker.random.string() }],
        });
      }
      result = await wobjects.searchWobjects({
        needCounters: true,
        string: '',
        skip: 0,
        limit: counter,
        object_type: searchedType,
      });
    });
    it('should return proper wobject length', async () => {
      expect(result.wobjects.length).to.be.eq(counter);
    });

    it('should return proper wobject counters', async () => {
      expect(result.wobjectsCounts[0])
        .to.be.deep.eq({ count: counter, object_type: searchedType, tagCategoties: [] });
    });
  });
});
