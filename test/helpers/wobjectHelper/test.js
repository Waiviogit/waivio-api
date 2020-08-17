const _ = require('lodash');
const {
  faker, dropDatabase, expect, wObjectHelper,
} = require('test/testHelper');
const { AppFactory, AppendObjectFactory } = require('test/factories');
const { FIELDS_NAMES } = require('constants/wobjectsData');

describe('On wobjectHelper', async () => {
  let app, admin, administrative, ownership;
  beforeEach(async () => {
    await dropDatabase();
    admin = faker.name.firstName();
    administrative = faker.name.firstName();
    ownership = faker.name.firstName();
    app = await AppFactory.Create({
      admins: [admin],
      ownership: [ownership],
      administrative: [administrative],
    });
  });
  describe('getUpdates without adminVotes and filters', async () => {
    let object, body, result;
    beforeEach(async () => {
      body = faker.image.imageUrl();
      ({ wobject: object } = await AppendObjectFactory.Create(
        { weight: 1, name: FIELDS_NAMES.AVATAR, body },
      ));
      result = await wObjectHelper.processWobjects({ wobjects: [object], app, returnArray: false });
    });
    it('should return correct field if weight > 0 and no downvotes', async () => {
      expect(result[FIELDS_NAMES.AVATAR]).to.be.eq(body);
    });
    it('should return correct length of fields', async () => {
      expect(result.fields.length).to.be.eq(object.fields.length);
    });
  });

  describe('getUpdates without adminVotes and with filters', async () => {
    let object, body, result;
    beforeEach(async () => {
      body = faker.image.imageUrl();
      ({ wobject: object } = await AppendObjectFactory.Create(
        { weight: 1, name: FIELDS_NAMES.AVATAR, body },
      ));
      ({ wobject: object } = await AppendObjectFactory.Create(
        { weight: 1, name: FIELDS_NAMES.ADDRESS, rootWobj: object.author_permlink },
      ));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false, fields: [FIELDS_NAMES.ADDRESS],
      });
    });
    it('return field which set in filter', async () => {
      expect(result[FIELDS_NAMES.ADDRESS]).to.be.exist;
    });
    it('should return correct length of fields', async () => {
      expect(result.fields.length).to.be.not.eq(object.fields.length);
    });
    it('should not return another object field', async () => {
      expect(result[FIELDS_NAMES.AVATAR]).to.not.exist;
    });
  });

  describe('On object tag categories elements without adminVotes and with filters', async () => {
    let object, id, result, body;
    beforeEach(async () => {
      body = faker.random.string();
      id = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create(
        { weight: 1, name: FIELDS_NAMES.TAG_CATEGORY, id },
      ));
      await AppendObjectFactory.Create(
        { weight: 1, name: FIELDS_NAMES.TAG_CATEGORY, id: faker.random.string() },
      );
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: 1, name: FIELDS_NAMES.CATEGORY_ITEM, rootWobj: object.author_permlink, id, body,
      }));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false,
      });
    });
    it('should return correct fields length without filters', async () => {
      expect(result.fields.length).to.be.eq(object.fields.length);
    });
    it('should not return category item field', async () => {
      expect(result[FIELDS_NAMES.CATEGORY_ITEM]).to.not.exist;
    });
    it('should add category item to tag category', async () => {
      const tagCategory = result[FIELDS_NAMES.TAG_CATEGORY];
      const item = _.find(tagCategory[0].items, (itm) => itm.body === body);
      expect(item).to.be.exist;
    });
    it('should not return tag category without elements', async () => {
      const tagCategory = result[FIELDS_NAMES.TAG_CATEGORY];
      expect(tagCategory.length).to.be.eq(1);
    });
  });

  describe('On object gallery items without adminVotes and with filters, and one downvoted', async () => {
    let object, id, result, body;
    beforeEach(async () => {
      const permlink = faker.random.string();
      const name = FIELDS_NAMES.GALLERY_ITEM;
      body = faker.random.string();
      id = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: 1, name, id: permlink, rootWobj: permlink,
      }));
      await AppendObjectFactory.Create({
        weight: _.random(10, 100), name, id: permlink, rootWobj: permlink,
      });
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: _.random(-1, -100), name, rootWobj: object.author_permlink, id, body,
      }));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false,
      });
    });
    it('should not return item with negative weight', async () => {
      expect(result[FIELDS_NAMES.GALLERY_ITEM].length).to.be.eq(object.fields.length - 1);
    });
    it('should return correct photos count length', async () => {
      expect(result.photos_count).to.be.eq(object.fields.length - 1);
    });
    it('should correctly sort fields for preview gallery', async () => {
      expect(result.preview_gallery[0].weight)
        .to.be.greaterThan(result.preview_gallery[1].weight);
    });
    it('should not return gallery album if it not exist', async () => {
      expect(result[FIELDS_NAMES.GALLERY_ALBUM]).to.be.undefined;
    });
  });

  describe('On object gallery albums without adminVotes and with filters', async () => {
    let object, id, result, body;
    beforeEach(async () => {
      body = faker.random.string();
      id = faker.random.string();
      const name = FIELDS_NAMES.GALLERY_ALBUM;
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: 1, name, id,
      }));
      await AppendObjectFactory.Create({
        weight: 1, name, id: faker.random.string(), rootWobj: object.author_permlink,
      });
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: 1, name: FIELDS_NAMES.GALLERY_ITEM, rootWobj: object.author_permlink, id, body,
      }));
      result = await wObjectHelper.processWobjects({
        fields: [name, FIELDS_NAMES.GALLERY_ITEM],
        wobjects: [_.cloneDeep(object)],
        returnArray: false,
        app,
      });
    });
    it('should not return gallery item field', async () => {
      expect(result[FIELDS_NAMES.GALLERY_ITEM]).to.not.exist;
    });
    it('should add gallery item to gallery album', async () => {
      const tagCategory = result[FIELDS_NAMES.GALLERY_ALBUM];
      const item = _.find(tagCategory[0].items, (itm) => itm.body === body);
      expect(item).to.be.exist;
    });
    it('should return gallery album without elements', async () => {
      const albums = result[FIELDS_NAMES.GALLERY_ALBUM];
      expect(albums.length).to.be.eq(2);
    });
  });

  describe('On another array fields, with downvotes', async () => {
    let object, result, body;
    beforeEach(async () => {
      body = faker.random.string();
      const name = FIELDS_NAMES.BUTTON;
      ({ wobject: object } = await AppendObjectFactory.Create({ weight: 1, name }));
      await AppendObjectFactory.Create({
        weight: _.random(-1, -100), name, rootWobj: object.author_permlink,
      });
      await AppendObjectFactory.Create({
        weight: 1,
        body,
        name,
        rootWobj: object.author_permlink,
        activeVotes: [
          { voter: faker.random.string(), percent: -100, weight: -1 },
          { voter: faker.random.string(), percent: 100, weight: 1 },
        ],
      });
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: 1, name, rootWobj: object.author_permlink,
      }));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], returnArray: false, app,
      });
    });
    it('should not return field with small approve percent', async () => {
      const button = _.find(result.fields, { body });
      expect(button.approvePercent).to.be.eq(50);
    });
    it('should return correct length of elements', async () => {
      expect(result[FIELDS_NAMES.BUTTON].length).to.be.eq(2);
    });
  });

  describe('With only downvotes on field', async () => {
    let object, result, body;
    beforeEach(async () => {
      const name = FIELDS_NAMES.ADDRESS;
      body = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: -1,
        name,
        body,
        activeVotes: [{ voter: faker.random.string(), percent: -100, weight: -1 }],
      }));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false,
      });
    });
    it('should not return field to show with downvotes', async () => {
      expect(result[FIELDS_NAMES.ADDRESS]).to.be.undefined;
    });
    it('should return correct approve percent in fields', async () => {
      const field = _.find(result.fields, { body });
      expect(field.approvePercent).to.be.eq(0);
    });
  });

  describe('with not array admin vote on negative weight field', async () => {
    let object, result, body;
    beforeEach(async () => {
      const name = FIELDS_NAMES.ADDRESS;
      body = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: -99,
        name,
        body,
        activeVotes: [{ voter: faker.random.string(), percent: -100, weight: -100 },
          { voter: admin, percent: 100, weight: 1 }],
      }));
      ({ wobject: object } = await AppendObjectFactory.Create(
        { weight: 1, name, rootWobj: object.author_permlink },
      ));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false,
      });
    });
    it('should return approve percent 100 on field', async () => {
      const field = _.find(result.fields, { body });
      expect(field.approvePercent).to.be.eq(100);
    });
    it('should add field to wobject', async () => {
      expect(result[FIELDS_NAMES.ADDRESS]).to.be.eq(body);
    });
    it('should add correct admin role to field', async () => {
      const field = _.find(result.fields, { body });
      expect(field.adminVote.role).to.be.eq('admin');
    });
  });

  describe('with not array administrative vote on negative weight field', async () => {
    let object, result, body;
    beforeEach(async () => {
      const name = FIELDS_NAMES.ADDRESS;
      body = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: -500,
        name,
        body,
        administrative: [administrative],
        activeVotes: [{ voter: faker.random.string(), percent: -100, weight: -501 },
          { voter: administrative, percent: 100, weight: 1 }],
      }));
      ({ wobject: object } = await AppendObjectFactory.Create(
        { weight: 1, name, rootWobj: object.author_permlink },
      ));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false,
      });
    });
    it('should return approve percent 100 on field with administrative vote', async () => {
      const field = _.find(result.fields, { body });
      expect(field.approvePercent).to.be.eq(100);
    });
    it('should add field to wobject', async () => {
      expect(result[FIELDS_NAMES.ADDRESS]).to.be.eq(body);
    });
    it('should add correct admin role to field', async () => {
      const field = _.find(result.fields, { body });
      expect(field.adminVote.role).to.be.eq('administrative');
    });
  });

  describe('with not array ownership vote on negative weight field, and another fields', async () => {
    let object, result, body;
    beforeEach(async () => {
      const name = FIELDS_NAMES.ADDRESS;
      body = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: -300,
        name,
        body,
        ownership: [ownership],
        activeVotes: [{ voter: faker.random.string(), percent: -100, weight: -301 },
          { voter: ownership, percent: 100, weight: 1 }],
      }));
      ({ wobject: object } = await AppendObjectFactory.Create(
        { weight: 1, name: FIELDS_NAMES.AVATAR, rootWobj: object.author_permlink },
      ));
      ({ wobject: object } = await AppendObjectFactory.Create(
        {
          weight: 1,
          name: FIELDS_NAMES.DESCRIPTION,
          rootWobj: object.author_permlink,
          activeVotes: [
            { voter: admin, percent: 100, weight: 1 }],
        },
      ));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false,
      });
    });
    it('should return approve percent 100 on field with ownership vote', async () => {
      const field = _.find(result.fields, { body });
      expect(field.approvePercent).to.be.eq(100);
    });
    it('should add field to wobject', async () => {
      expect(result[FIELDS_NAMES.ADDRESS]).to.be.eq(body);
    });
    it('should add correct admin role to field', async () => {
      const field = _.find(result.fields, { body });
      expect(field.adminVote.role).to.be.eq('ownership');
    });
    it('should not add to wobject field without ownership and admin vote', async () => {
      expect(result[FIELDS_NAMES.AVATAR]).to.be.undefined;
    });
    it('should add field with admin vote and without ownership', async () => {
      const field = _.find(result.fields, { name: FIELDS_NAMES.DESCRIPTION });
      expect(field).to.be.exist;
    });
  });

  describe('on admin vote and admin downvote', async () => {

  });

  describe('same fields with admin votes', async () => {

  });

  describe('on admin downvote and administrative vote', async () => {

  });

  describe('on admin downvote and ownership vote', async () => {

  });

  describe('on administrative vote at object with ownership', async () => {

  });

    describe('on administrative vote at object with ownership', async () => {

    });
});
