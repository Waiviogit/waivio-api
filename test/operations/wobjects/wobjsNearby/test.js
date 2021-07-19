const { getWobjsNearby } = require('utilities/operations').wobject;
const { expect, dropDatabase, _ } = require('test/testHelper');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const { ObjectFactory, AppFactory } = require('test/factories');

describe('On wobjects search', async () => {
  let main, parent, child;
  const searchedType = _.sample(Object.values(OBJECT_TYPES));
  beforeEach(async () => {
    await dropDatabase();
    main = await AppFactory.Create({
      inherited: false,
      canBeExtended: false,
    });
    parent = await AppFactory.Create({
      inherited: false,
      canBeExtended: true,
      supportedTypes: [OBJECT_TYPES.RESTAURANT],
    });
  });
  describe('Nearby tests', async () => {
    let wobj1, wobj2, wobj3, result;
    beforeEach(async () => {
      wobj1 = await ObjectFactory.Create({
        objectType: OBJECT_TYPES.RESTAURANT,
        map: { type: 'Point', coordinates: [-73.9928, 40.7193] },
      });
      wobj2 = await ObjectFactory.Create({
        objectType: OBJECT_TYPES.RESTAURANT,
        map: { type: 'Point', coordinates: [-73.9928, 40.7193] },
      });
      wobj3 = await ObjectFactory.Create({
        objectType: OBJECT_TYPES.RESTAURANT,
        map: { type: 'Point', coordinates: [95.233, -48.224] },
      });
    });
    it('should return objects from the search area', async () => {
      const wobj = await ObjectFactory.Create({
        map: { type: 'Point', coordinates: [-73.9928, 40.7193] },
      });
      result = await getWobjsNearby({
        authorPermlink: wobj.author_permlink, radius: 200, app: main,
      });
      expect(_.map(result.wobjects, 'author_permlink')).to.be.include(wobj1.author_permlink, wobj2.author_permlink);
    });
    it('should return objects that parent object types', async () => {
      const wobj = await ObjectFactory.Create({
        objectType: OBJECT_TYPES.HASHTAG,
        map: { type: 'Point', coordinates: [-73.9928, 40.7193] },
      });
      result = await getWobjsNearby({
        authorPermlink: wobj1.author_permlink, radius: 20000, app: parent,
      });
      expect(_.map(result.wobjects, 'author_permlink')).to.be.not.include(wobj.author_permlink);
    });
    it('should return objects that correspond to a child app', async () => {
      const wobj = await ObjectFactory.Create({
        map: { type: 'Point', coordinates: [-73.9928, 40.7193] },
      });
      child = await AppFactory.Create({
        inherited: true,
        canBeExtended: false,
        supportedTypes: [searchedType, OBJECT_TYPES.RESTAURANT],
        supportedObjects: [wobj.author_permlink, wobj1.author_permlink],
      });
      result = await getWobjsNearby({
        authorPermlink: wobj1.author_permlink, radius: 20000, app: child,
      });
      expect(_.map(result.wobjects, 'author_permlink')).to.be.not.include(wobj2.author_permlink);
    });
    it('should return empty array if there are no objects nearby', async () => {
      result = await getWobjsNearby({
        authorPermlink: wobj3.author_permlink, radius: 10, app: main,
      });
      expect(result.wobjects).to.be.empty;
    });
  });
});
