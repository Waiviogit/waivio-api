const {
  faker, expect, dropDatabase, _, WobjModel, sinon,
} = require('test/testHelper');
const { getChildren } = require('utilities/operations/wobject');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const { ObjectFactory } = require('test/factories');

describe('On getChildren', async () => {
  describe('On error', async () => {
    beforeEach(async () => {
      sinon.stub(WobjModel, 'find').returns({ error: new Error() });
    });
    afterEach(() => {
      sinon.restore();
    });
    it('should return error', async () => {
      const { error } = await getChildren({});
      expect(error).to.be.exist;
    });
  });

  describe('On ok', async () => {
    const parentAuthorPermlink = faker.random.string();
    const sameNameCount = _.random(1, 3);
    const sameName = faker.random.string();
    const otherChildrenCount = _.random(1, 3);
    const randomCount = _.random(1, 3);
    const excludedObjectType = _.sample(Object.values(OBJECT_TYPES));
    beforeEach(async () => {
      await dropDatabase();
      await ObjectFactory.Create({ authorPermlink: parentAuthorPermlink });
      for (let i = 0; i < sameNameCount; i++) {
        await ObjectFactory.Create({
          parent: parentAuthorPermlink,
          weight: _.random(1, 99),
          fields: [{ name: 'name', body: sameName }],
        });
      }
      for (let i = 0; i < otherChildrenCount; i++) {
        await ObjectFactory.Create({
          parent: parentAuthorPermlink,
          weight: _.random(1, 99),
          objectType: excludedObjectType,
        });
      }
      for (let i = 0; i < randomCount; i++) { await ObjectFactory.Create(); }
    });
    it('should return only children', async () => {
      const { wobjects } = await getChildren({ authorPermlink: parentAuthorPermlink });
      _.forEach(wobjects, (w) => {
        expect(w.parent).to.be.eq(parentAuthorPermlink);
      });
    });

    it('should return valid results by search string', async () => {
      const { wobjects } = await getChildren({
        authorPermlink: parentAuthorPermlink, searchString: sameName,
      });
      _.forEach(wobjects, (w) => {
        expect(w.fields[0].body).to.be.eq(sameName);
      });
    });

    it('should not return excluded types', async () => {
      const { wobjects } = await getChildren({
        authorPermlink: parentAuthorPermlink, excludeTypes: [excludedObjectType],
      });
      _.forEach(wobjects, (w) => {
        expect(w.object_type).to.be.not.eq(excludedObjectType);
      });
    });

    it('should not return excluded types', async () => {
      const { wobjects } = await getChildren({ authorPermlink: parentAuthorPermlink });
      const firstElWeight = wobjects[0].weight;
      const lastElWeight = wobjects[wobjects.length - 1].weight;

      expect(firstElWeight).to.be.greaterThan(lastElWeight);
    });
  });
});
