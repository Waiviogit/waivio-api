const moment = require('moment');
const _ = require('lodash');
const {
  faker, dropDatabase, expect, wObjectHelper, sinon, postsUtil,
} = require('test/testHelper');
const { AppFactory, AppendObjectFactory, ObjectTypeFactory } = require('test/factories');
const { FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');
const { getNamespace } = require('cls-hooked');
const { DEVICE } = require('constants/common');

describe('On wobjectHelper', async () => {
  let app, admin, admin2, administrative, ownership, ownershipObject, objectType;
  beforeEach(async () => {
    await dropDatabase();
    objectType = await ObjectTypeFactory.Create(
      { exposedFields: _.difference(Object.values(FIELDS_NAMES), [FIELDS_NAMES.PRICE]) },
    );
    admin = faker.name.firstName();
    admin2 = faker.name.firstName();
    administrative = faker.name.firstName();
    ownershipObject = faker.random.string();
    ownership = faker.name.firstName();
    sinon.stub(postsUtil, 'getPostState').returns(Promise.resolve({ result: { content: {} } }));
    app = await AppFactory.Create({
      admins: [admin, admin2],
      authority: [ownership, administrative],
      ownershipObjects: [ownershipObject],
    });
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('filter fields by object type exposedFields', async () => {
    let object, result;
    beforeEach(async () => {
      const fields = [FIELDS_NAMES.AVATAR, FIELDS_NAMES.NAME, FIELDS_NAMES.PRICE];
      for (const name of fields) {
        ({ wobject: object } = await AppendObjectFactory.Create({
          weight: 1, name, objectType: objectType.name, rootWobj: _.get(object, 'author_permlink', faker.random.string()),
        }));
      }
      result = await wObjectHelper.processWobjects({
        wobjects: [object], app, returnArray: false, hiveData: true,
      });
    });
    it('should return field avatar if object type exposedFields include it', async () => {
      expect(result[FIELDS_NAMES.AVATAR]).to.be.exist;
    });
    it('should return field name if object type exposedFields include it', async () => {
      expect(result[FIELDS_NAMES.NAME]).to.be.exist;
    });
    it('should not return field if object type exposedFields not include it', async () => {
      expect(result[FIELDS_NAMES.PRICE]).to.be.undefined;
    });
    it('should filter fields by exposed (avatar include)', async () => {
      const field = _.find(result.fields, (rec) => rec.name === FIELDS_NAMES.AVATAR);
      expect(field).to.be.exist;
    });
    it('should filter fields by exposed (name include)', async () => {
      const field = _.find(result.fields, (rec) => rec.name === FIELDS_NAMES.NAME);
      expect(field).to.be.exist;
    });
    it('should filter fields by exposed (address not include)', async () => {
      const field = _.find(result.fields, (rec) => rec.name === FIELDS_NAMES.ADDRESS);
      expect(field).to.be.undefined;
    });
  });

  describe('getUpdates without adminVotes and filters', async () => {
    let object, body, result;
    beforeEach(async () => {
      body = faker.image.imageUrl();
      ({ wobject: object } = await AppendObjectFactory.Create({
        weight: 1, name: FIELDS_NAMES.AVATAR, body, objectType: objectType.name,
      }));
      result = await wObjectHelper.processWobjects({
        wobjects: [object], app, returnArray: false, hiveData: true,
      });
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
        wobjects: [_.cloneDeep(object)],
        app,
        returnArray: false,
        fields: [FIELDS_NAMES.ADDRESS],
        hiveData: true,
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
        wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
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
        wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
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
        hiveData: true,
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
        wobjects: [_.cloneDeep(object)], returnArray: false, app, hiveData: true,
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
        wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
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
        wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
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
        wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
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
        rootWobj: ownershipObject,
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
        wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
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
    describe('vote later downvote', async () => {
      let object, result, body;
      beforeEach(async () => {
        const name = FIELDS_NAMES.TITLE;
        body = faker.random.string();
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          body,
          activeVotes: [{
            voter: admin2,
            percent: -100,
            weight: -301,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(1, 'day').valueOf()),
          }, {
            voter: admin,
            percent: 100,
            weight: 1,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }],
        }));
        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should add approvePercent 100', async () => {
        const field = _.find(result.fields, { body });
        expect(field.approvePercent).to.be.eq(100);
      });
      it('should return need field in object', async () => {
        expect(result[FIELDS_NAMES.TITLE]).to.be.eq(body);
      });
    });
    describe('vote earlier downvote', async () => {
      let object, result, body;
      beforeEach(async () => {
        const name = FIELDS_NAMES.DESCRIPTION;
        body = faker.random.string();
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          body,
          activeVotes: [{
            voter: admin2,
            percent: -100,
            weight: -301,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }, {
            voter: admin,
            percent: 100,
            weight: 1,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(1, 'day').valueOf()),
          }],
        }));
        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should add approvePercent 0', async () => {
        const field = _.find(result.fields, { body });
        expect(field.approvePercent).to.be.eq(0);
      });
      it('should not return need field in object', async () => {
        expect(result[FIELDS_NAMES.TITLE]).to.be.undefined;
      });
    });
  });

  describe('same fields with admin votes', async () => {
    let object, result, body1, body2;
    beforeEach(async () => {
      const name = FIELDS_NAMES.NAME;
      body1 = faker.random.string();
      body2 = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create({
        name,
        body: body1,
        activeVotes: [{
          voter: admin,
          percent: 100,
          weight: 301,
          _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
        }],
      }));
      ({ wobject: object } = await AppendObjectFactory.Create({
        name,
        body: body2,
        rootWobj: object.author_permlink,
        activeVotes: [{
          voter: admin2,
          percent: 100,
          weight: 301,
          _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(1, 'day').valueOf()),
        }],
      }));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
      });
    });
    it('should return 100 approval to first field', async () => {
      const field = _.find(result.fields, { body: body1 });
      expect(field.approvePercent).to.be.eq(100);
    });
    it('should return 100 approval to second field', async () => {
      const field = _.find(result.fields, { body: body2 });
      expect(field.approvePercent).to.be.eq(100);
    });
    it('should win field with latest admin vote', async () => {
      expect(result[FIELDS_NAMES.NAME]).to.be.eq(body1);
    });
  });

  describe('on admin and administrative actions', async () => {
    describe('On admin vote and administrative vote', async () => {
      let object, result, body;
      beforeEach(async () => {
        const name = FIELDS_NAMES.NAME;
        body = faker.random.string();
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          body,
          administrative: [administrative],
          activeVotes: [{
            voter: admin,
            percent: 100,
            weight: 301,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(1, 'day').valueOf()),
          }, {
            voter: administrative,
            percent: 100,
            weight: 500,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }],
        }));

        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should return field which was upvoted by admin', async () => {
        expect(result[FIELDS_NAMES.NAME]).to.be.eq(body);
      });
      it('should return correct admin role', async () => {
        const field = _.find(result.fields, { body });
        expect(field.adminVote.role).to.be.eq('admin');
      });
    });
    describe('On admin downvote and administrative vote', async () => {
      let object, result, body;
      beforeEach(async () => {
        const name = FIELDS_NAMES.STATUS;
        body = faker.random.string();
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          administrative: [administrative],
          body,
          activeVotes: [{
            voter: admin,
            percent: -100,
            weight: -1000,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(10, 'day').valueOf()),
          }, {
            voter: administrative,
            percent: 100,
            weight: 500,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }],
        }));

        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should return field which was downvoted by admin', async () => {
        expect(result[FIELDS_NAMES.NAME]).to.be.undefined;
      });
      it('should return correct approvePercent', async () => {
        const field = _.find(result.fields, { body });
        expect(field.approvePercent).to.be.eq(0);
      });
    });
  });

  describe('on admin and ownership actions', async () => {
    describe('On ownership votes select app ownership object status', async () => {
      let object, result, body;
      beforeEach(async () => {
        body = faker.random.string();
        ({ wobject: object } = await AppendObjectFactory.Create({
          name: FIELDS_NAMES.DESCRIPTION,
          ownership: [ownership],
          body,
          activeVotes: [{
            voter: ownership,
            weight: 1,
            percent: 100,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }],
        }));
        ({ wobject: object } = await AppendObjectFactory.Create({
          name: FIELDS_NAMES.AVATAR,
          rootWobj: object.author_permlink,
          body,
        }));
        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should return description field in response which has ownership upvote', async () => {
        expect(result[FIELDS_NAMES.DESCRIPTION]).to.be.exist;
      });
      it('should not return avatar field without ownership upvote', async () => {
        expect(result[FIELDS_NAMES.AVATAR]).to.be.not.exist;
      });
    });

    describe('On admin vote and ownership vote', async () => {
      let object, result, body;
      beforeEach(async () => {
        const name = FIELDS_NAMES.DESCRIPTION;
        body = faker.random.string();
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          rootWobj: ownershipObject,
          ownership: [ownership],
          body,
          activeVotes: [{
            voter: admin,
            percent: 100,
            weight: 1,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(1, 'day').valueOf()),
          }, {
            voter: ownership,
            weight: 1,
            percent: 100,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }],
        }));
        ({ wobject: object } = await AppendObjectFactory.Create({
          name: FIELDS_NAMES.AVATAR,
          rootWobj: ownershipObject,
          body,
        }));
        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should return field which was upvoted by admin', async () => {
        expect(result[FIELDS_NAMES.DESCRIPTION]).to.be.eq(body);
      });
      it('should return correct admin role', async () => {
        const field = _.find(result.fields, { body });
        expect(field.adminVote.role).to.be.eq('admin');
      });
      it('should not return avatar field if there no admin vote', async () => {
        expect(result[FIELDS_NAMES.AVATAR]).to.be.undefined;
      });
    });
    describe('On admin downvote and ownership vote', async () => {
      let object, result, body;
      beforeEach(async () => {
        const name = FIELDS_NAMES.TITLE;
        body = faker.random.string();
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          body,
          rootWobj: ownershipObject,
          ownership: [ownership],
          activeVotes: [{
            voter: admin,
            percent: -50,
            weight: -100,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(1, 'day').valueOf()),
          }, {
            voter: ownership,
            percent: 100,
            weight: 500,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }],
        }));

        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should return field which was downvoted by admin', async () => {
        expect(result[FIELDS_NAMES.TITLE]).to.be.undefined;
      });
      it('should return correct approvePercent', async () => {
        const field = _.find(result.fields, { body });
        expect(field.approvePercent).to.be.eq(0);
      });
    });
  });

  describe('on administrative actions at object with ownership', async () => {
    let object, result, body;
    beforeEach(async () => {
      const name = FIELDS_NAMES.NAME;
      body = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create({
        name,
        rootWobj: ownershipObject,
        administrative: [administrative],
        ownership: [ownership],
        body,
        activeVotes: [{
          voter: ownership,
          percent: 100,
          weight: 500,
          _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
        }],
      }));
      ({ wobject: object } = await AppendObjectFactory.Create({
        name: FIELDS_NAMES.TITLE,
        body,
        rootWobj: object.author_permlink,
        activeVotes: [{
          voter: administrative,
          percent: 100,
          weight: 500,
          _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
        }],
      }));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
      });
    });
    it('should not add field which was not approved by ownership', async () => {
      expect(result[FIELDS_NAMES.TITLE]).to.be.undefined;
    });
    it('should return correct approval percent for administrative field', async () => {
      const field = _.find(result.fields, { body, name: FIELDS_NAMES.TITLE });
      expect(field.approvePercent).to.be.eq(100);
    });
    it('should add field which was approved by ownership', async () => {
      expect(result[FIELDS_NAMES.NAME]).to.be.eq(body);
    });
    it('should return correct approval percent for ownership field', async () => {
      const field = _.find(result.fields, { body, name: FIELDS_NAMES.NAME });
      expect(field.approvePercent).to.be.eq(100);
    });
  });

  describe('with another user locale', async () => {
    let object, result, body;
    beforeEach(async () => {
      const name = FIELDS_NAMES.NAME;
      body = faker.random.string();
      ({ wobject: object } = await AppendObjectFactory.Create({
        name,
        body,
        activeVotes: [{
          voter: faker.random.string(),
          percent: 100,
          weight: 500,
          _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
        }],
      }));
      result = await wObjectHelper.processWobjects({
        wobjects: [_.cloneDeep(object)], app, returnArray: false, locale: 'ms-MY', hiveData: true,
      });
    });
    it('should get name from field with en-US locale if can\'t find user locale', async () => {
      expect(result[FIELDS_NAMES.NAME]).to.be.eq(body);
    });

    it('should field locale be eq en-US ', async () => {
      expect(result.fields[0].locale).to.be.eq('en-US');
    });

    it('should return field in all fields with approve percent', async () => {
      const field = _.find(result.fields, { body, name: FIELDS_NAMES.NAME });
      expect(field.approvePercent).to.be.eq(100);
    });
  });

  describe('On owner vote', async () => {
    describe('On owner & admin upvote', async () => {
      let object, result, body1, body2;
      beforeEach(async () => {
        body1 = faker.random.string();
        body2 = faker.random.string();
        const name = FIELDS_NAMES.NAME;
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          body: body1,
          activeVotes: [{
            voter: admin,
            percent: 100,
            weight: 301,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }],
        }));
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          body: body2,
          rootWobj: object.author_permlink,
          activeVotes: [{
            voter: app.owner,
            percent: 100,
            weight: 301,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(5, 'day').valueOf()),
          }],
        }));
        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should return name which was upvoted by owner', async () => {
        expect(result[FIELDS_NAMES.NAME]).to.be.eq(body2);
      });
    });
    describe('On owner downvote& admin upvote', async () => {
      let object, result, body;
      beforeEach(async () => {
        body = faker.random.string();

        const name = FIELDS_NAMES.NAME;
        ({ wobject: object } = await AppendObjectFactory.Create({
          name,
          body,
          activeVotes: [{
            voter: admin,
            percent: 100,
            weight: 301,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().valueOf()),
          }, {
            voter: app.owner,
            percent: -100,
            weight: -301,
            _id: AppendObjectFactory.objectIdFromDateString(moment.utc().subtract(5, 'day').valueOf()),
          }],
        }));
        result = await wObjectHelper.processWobjects({
          wobjects: [_.cloneDeep(object)], app, returnArray: false, hiveData: true,
        });
      });
      it('should return name which was upvoted by owner', async () => {
        expect(result[FIELDS_NAMES.NAME]).to.be.undefined;
      });
    });
  });

  describe('on getLinkToPageLoad', async () => {
    let obj, link, expectedLink, menuList, menuList2, menuPage;

    beforeEach(() => {
      menuList = { type: 'menuList', body: faker.random.string(), weight: _.random(100, 200) };
      menuList2 = { type: 'menuList', body: faker.random.string(), weight: _.random(0, 99) };
      menuPage = { type: 'menuPage', body: faker.random.string() };
    });

    it('should return proper link on obj type page', async () => {
      obj = { object_type: OBJECT_TYPES.PAGE, author_permlink: faker.random.string() };
      expectedLink = `/object/${obj.author_permlink}/page`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return proper link on obj type list', async () => {
      obj = { object_type: OBJECT_TYPES.LIST, author_permlink: faker.random.string() };
      expectedLink = `/object/${obj.author_permlink}/list`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return  /object/author_permlink on some obj types', async () => {
      obj = {
        object_type: _.sample(Object.values(_.pick(OBJECT_TYPES, ['HASHTAG', 'DISH', 'DRINK', 'CRYPTO']))),
        author_permlink: faker.random.string(),
      };
      expectedLink = `/object/${obj.author_permlink}`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return /object/author_permlink on hashtag obj type', async () => {
      sinon.stub(getNamespace('request-session'), 'get').returns(DEVICE.MOBILE);
      obj = {
        object_type: OBJECT_TYPES.HASHTAG,
        author_permlink: faker.random.string(),
      };
      expectedLink = `/object/${obj.author_permlink}`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return /object/author_permlink on any obj type except hashtag type', async () => {
      sinon.stub(getNamespace('request-session'), 'get').returns(DEVICE.MOBILE);
      obj = {
        object_type: _.sample(Object.values(_.omit(OBJECT_TYPES, ['HASHTAG']))),
        author_permlink: faker.random.string(),
      };
      expectedLink = `/object/${obj.author_permlink}/about`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return menuList with greater weight if wobject does not have sort custom and have both menuList menuPage', async () => {
      obj = {
        object_type: _.sample(Object.values(_.omit(OBJECT_TYPES, ['LIST', 'PAGE', 'HASHTAG', 'DISH', 'DRINK', 'CRYPTO']))),
        author_permlink: faker.random.string(),
        listItem: [menuList, menuList2, menuPage],
      };
      expectedLink = `/object/${obj.author_permlink}/menu#${menuList.body}`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return menuList with admin vote if wobject does not have sort custom and have both menuList menuPage', async () => {
      menuList2.adminVote = { timestamp: _.random(1, 100) };
      obj = {
        object_type: _.sample(Object.values(_.omit(OBJECT_TYPES, ['LIST', 'PAGE', 'HASHTAG', 'DISH', 'DRINK', 'CRYPTO']))),
        author_permlink: faker.random.string(),
        listItem: [menuList, menuList2, menuPage],
      };
      expectedLink = `/object/${obj.author_permlink}/menu#${menuList2.body}`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return menuPage if wobject does not have neither sort custom nor menuList', async () => {
      obj = {
        object_type: _.sample(Object.values(_.omit(OBJECT_TYPES, ['LIST', 'PAGE', 'HASHTAG', 'DISH', 'DRINK', 'CRYPTO']))),
        author_permlink: faker.random.string(),
        listItem: [menuPage],
      };
      expectedLink = `/object/${obj.author_permlink}/page#${menuPage.body}`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return first element of array sortCustom in obj', async () => {
      obj = {
        object_type: _.sample(Object.values(OBJECT_TYPES)),
        author_permlink: faker.random.string(),
        listItem: [menuList, menuPage],
        sortCustom: [menuPage.body],
      };
      expectedLink = `/object/${obj.author_permlink}/page#${menuPage.body}`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });

    it('should return /object/author_permlink if can not find sortCustom in listItem', async () => {
      obj = {
        object_type: _.sample(Object.values(_.omit(OBJECT_TYPES, ['LIST']))),
        author_permlink: faker.random.string(),
        sortCustom: [menuPage.body],
      };
      expectedLink = `/object/${obj.author_permlink}`;
      link = wObjectHelper.getLinkToPageLoad(obj);
      expect(link).to.be.eq(expectedLink);
    });
  });
});
