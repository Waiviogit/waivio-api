const { OBJECT_TYPES, FIELDS_NAMES } = require('constants/wobjectsData');
const {
  faker, expect, App, dropDatabase, sinon,
} = require('test/testHelper');
const { AppFactory, ObjectFactory, AppendObjectFactory } = require('test/factories');
const { configurationMock } = require('test/controllers/sites/mocks');
const sitesHelper = require('utilities/helpers/sitesHelper');

describe('On sitesHelper', async () => {
  let parent;
  beforeEach(async () => {
    await dropDatabase();
    parent = await AppFactory.Create({
      inherited: false,
      canBeExtended: true,
      configuration: configurationMock(),
      supportedTypes: [OBJECT_TYPES.RESTAURANT],
      filters: {
        restaurant: { Cuisine: [] }, dish: { Ingredients: [] },
      },
    });
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('On updateSupportedObjects', async () => {
    describe('With authorities', async () => {
      let app, authority, object;
      beforeEach(async () => {
        authority = faker.random.string();
        app = await AppFactory.Create({ authority: [authority], parent: parent._id });
        object = await ObjectFactory.Create({ objectType: OBJECT_TYPES.RESTAURANT, ownership: [authority] });
        await sitesHelper.updateSupportedObjects({ app, host: app.host });
      });
      it('should add wobject to app supported objects', async () => {
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.include(object.author_permlink);
      });
    });
    describe('With mapCoordinates', async () => {
      let app, authority, object;
      beforeEach(async () => {
        authority = faker.random.string();
        object = await ObjectFactory.Create({ objectType: OBJECT_TYPES.RESTAURANT, map: { type: 'Point', coordinates: [-94.233, 48.224] } });
      });
      it('should add wobject to app supported objects if wobj in box', async () => {
        app = await AppFactory.Create({ coordinates: [{ topPoint: [-94.233, 48.224], bottomPoint: [-92.233, 48.224] }], parent: parent._id });
        await sitesHelper.updateSupportedObjects({ app, host: app.host });
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.include(object.author_permlink);
      });
      it('should not add wobj to app if it not in box', async () => {
        app = await AppFactory.Create({ coordinates: [{ topPoint: [-44.233, 48.224], bottomPoint: [-42.233, 48.224] }], parent: parent._id });
        await sitesHelper.updateSupportedObjects({ app, host: app.host });
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.not.include(object.author_permlink);
      });
    });
    describe('With object filters and authorities', async () => {
      let app, authority, object, tag;
      beforeEach(async () => {
        tag = faker.random.string();
        authority = faker.random.string();
        app = await AppFactory.Create({ authority: [authority], parent: parent._id });
        ({ wobject: object } = await AppendObjectFactory.Create({
          objectType: OBJECT_TYPES.RESTAURANT,
          ownership: [authority],
          name: FIELDS_NAMES.CATEGORY_ITEM,
          body: tag,
          tagCategory: 'Cuisine',
        }));
      });
      it('should add wobject to app supported objects with authority and valid tag', async () => {
        await App.updateOne({ _id: app._id }, { $set: { 'object_filters.restaurant.Cuisine': [tag] } });
        await sitesHelper.updateSupportedObjects({ host: app.host });
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.include(object.author_permlink);
      });
      it('should  not add wobject to app supported objects with authority and not valid tag', async () => {
        await App.updateOne({ _id: app._id }, { $set: { 'object_filters.restaurant.Cuisine': [faker.random.string()] } });
        await sitesHelper.updateSupportedObjects({ host: app.host });
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.not.include(object.author_permlink);
      });
    });
    describe('With mapCoordinates and object filters', async () => {
      let app, authority, object, tag;
      beforeEach(async () => {
        tag = faker.random.string();
        authority = faker.random.string();
        ({ wobject: object } = await AppendObjectFactory.Create({
          objectType: OBJECT_TYPES.RESTAURANT,
          ownership: [authority],
          name: FIELDS_NAMES.CATEGORY_ITEM,
          body: tag,
          tagCategory: 'Cuisine',
          map: { type: 'Point', coordinates: [-94.233, 48.224] },
        }));
      });
      it('should add wobject to app supported objects if wobj in box with valid tag', async () => {
        app = await AppFactory.Create({ coordinates: [{ topPoint: [-94.233, 48.224], bottomPoint: [-92.233, 48.224] }], parent: parent._id });
        await App.updateOne({ _id: app._id }, { $set: { 'object_filters.restaurant.Cuisine': [tag] } });
        await sitesHelper.updateSupportedObjects({ host: app.host });
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.include(object.author_permlink);
      });
      it('should not add wobj to app if it not in box with valid tag', async () => {
        app = await AppFactory.Create({ coordinates: [{ topPoint: [-44.233, 48.224], bottomPoint: [-42.233, 48.224] }], parent: parent._id });
        await App.updateOne({ _id: app._id }, { $set: { 'object_filters.restaurant.Cuisine': [tag] } });
        await sitesHelper.updateSupportedObjects({ host: app.host });
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.not.include(object.author_permlink);
      });
      it('should not add wobj to app if it not in box with not valid tag', async () => {
        app = await AppFactory.Create({ coordinates: [{ topPoint: [-44.233, 48.224], bottomPoint: [-42.233, 48.224] }], parent: parent._id });
        await App.updateOne({ _id: app._id }, { $set: { 'object_filters.restaurant.Cuisine': [faker.random.string()] } });
        await sitesHelper.updateSupportedObjects({ host: app.host });
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.not.include(object.author_permlink);
      });
      it('should not add wobj to app if it in box with not valid tag', async () => {
        app = await AppFactory.Create({ coordinates: [{ topPoint: [-94.233, 48.224], bottomPoint: [-92.233, 48.224] }], parent: parent._id });
        await App.updateOne({ _id: app._id }, { $set: { 'object_filters.restaurant.Cuisine': [faker.random.string()] } });
        await sitesHelper.updateSupportedObjects({ host: app.host });
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.supported_objects).to.not.include(object.author_permlink);
      });

    });
  });
});
