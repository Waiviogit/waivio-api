const {
  faker, expect, dropDatabase, _, App,
} = require('test/testHelper');
const {
  OBJECT_TYPES, SITE_SEARCH_EXCLUDED_FIELDS, SEARCH_FIELDS,
} = require('constants/wobjectsData');
const { ObjectFactory, AppFactory, CampaignFactory } = require('test/factories');
const { CAMPAIGN_STATUSES } = require('constants/campaignsData');
const { wobjects } = require('utilities/operations/search');
const { STATUSES } = require('constants/sitesConstants');

describe('On wobjects search', async () => {
  let parent;
  const searchedType = _.sample(Object.values(OBJECT_TYPES));
  beforeEach(async () => {
    await dropDatabase();
    parent = await AppFactory.Create({
      inherited: false,
      canBeExtended: true,
      supportedTypes: [searchedType, OBJECT_TYPES.RESTAURANT],
    });
  });

  describe('On search with counters', async () => {
    let result;
    const counter = _.random(5, 10);
    const notSearchedTypes = Object.values(OBJECT_TYPES);
    notSearchedTypes.splice(notSearchedTypes.indexOf(searchedType), 1);
    const searchWords = [faker.random.string()];

    beforeEach(async () => {
      for (let i = 0; i < counter; i++) {
        await ObjectFactory.Create({
          objectType: searchedType,
          searchParams: { name: searchWords },
        });
      }
      for (let i = 0; i < _.random(1, 3); i++) {
        await ObjectFactory.Create({
          objectType: _.sample(notSearchedTypes),
          searchParams: { name: searchWords },
        });
      }
      result = await wobjects.searchWobjects({
        needCounters: true,
        limit: counter,
        object_type: searchedType,
      });
    });
    it('should return proper wobject length', async () => {
      expect(result.wobjects.length).to.be.eq(counter);
    });

    it('should return proper wobject counters', async () => {
      expect(result.wobjectsCounts[0])
        .to.be.deep.eq({ count: counter, object_type: searchedType, tagCategories: [] });
    });
  });

  describe('on box search', async () => {
    let wobj1, wobj2, campaign, result;
    beforeEach(async () => {
      wobj1 = await ObjectFactory.Create({
        objectType: OBJECT_TYPES.RESTAURANT,
        map: { type: 'Point', coordinates: [-94.233, 48.224] },
        searchParams: { name: [faker.random.string()] },
      });
      wobj2 = await ObjectFactory.Create({
        objectType: OBJECT_TYPES.RESTAURANT,
        map: { type: 'Point', coordinates: [-95.233, 48.224] },
        searchParams: { title: [faker.random.string()] },
      });
      campaign = await CampaignFactory.Create({
        status: CAMPAIGN_STATUSES.ACTIVE,
        requiredObject: wobj1.author_permlink,
        activation_permlink: faker.random.string(),
        objects: [wobj2.author_permlink],
      });
    });

    describe('On main sites map', async () => {
      it('should return two objects for parent if they in box', async () => {
        result = await wobjects.searchWobjects({
          app: parent,
          box: { topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] },
        });
        expect(result.wobjects).to.have.length(2);
      });

      it('should not return one of object in it not in box', async () => {
        result = await wobjects.searchWobjects({
          app: parent,
          box: { topPoint: [-94.235, 48.224], bottomPoint: [-91.233, 44.224] },
        });
        expect(result.wobjects).to.have.length(1);
      });

      it('should return primary campaign for object if it exist', async () => {
        result = await wobjects.searchWobjects({
          app: parent,
          box: { topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] },
        });

        const wobj = _.find(result.wobjects, { author_permlink: wobj1.author_permlink });
        expect(wobj.campaigns)
          .to.be.deep.eq({ min_reward: campaign.reward, max_reward: campaign.reward });
      });

      it('should return secondary campaign if it exist', async () => {
        result = await wobjects.searchWobjects({
          app: parent,
          box: { topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] },
        });

        const wobj = _.find(result.wobjects, { author_permlink: wobj2.author_permlink });
        expect(wobj.propositions).to.be.exist;
      });

      it('should always show wobjects with campaigns on top despite weight', async () => {
        for (let i = 0; i < _.random(2, 4); i++) {
          await ObjectFactory.Create({
            objectType: OBJECT_TYPES.RESTAURANT,
            map: { type: 'Point', coordinates: [-94.233, 48.224] },
            weight: _.random(2, 10),
          });
        }
        result = await wobjects.searchWobjects({
          app: parent,
          box: { topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] },
        });
        expect(result.wobjects[0]).to.have.own.property('campaigns');
      });

      it('should return wobjects created in beforeEach & this check. Should search by all fields exclude address, phone and email', async () => {
        const text = faker.random.string();
        const count = _.random(2, 4);
        const fieldName = _.chain(SEARCH_FIELDS)
          .filter((field) => !_.includes(SITE_SEARCH_EXCLUDED_FIELDS, field))
          .sample();
        for (let i = 0; i < count; i++) {
          await ObjectFactory.Create({
            objectType: OBJECT_TYPES.RESTAURANT,
            map: { type: 'Point', coordinates: [-94.233, 48.224] },
            weight: _.random(2, 10),
            searchParams: { [fieldName]: [text] },
          });
        }
        result = await wobjects.searchWobjects({
          app: parent,
          box: { topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] },
        });
        expect(result.wobjects).to.have.length(count + 2);
      });

      it('should return objects created in beforeEach and should not find objects by phone, email or address', async () => {
        const text = faker.random.string();
        const count = _.random(2, 4);
        const fieldName = _.sample(SITE_SEARCH_EXCLUDED_FIELDS);
        console.log(fieldName);
        for (let i = 0; i < count; i++) {
          await ObjectFactory.Create({
            objectType: OBJECT_TYPES.RESTAURANT,
            map: { type: 'Point', coordinates: [-94.233, 48.224] },
            weight: _.random(2, 10),
            searchParams: { [fieldName]: [text] },
          });
        }
        result = await wobjects.searchWobjects({
          app: parent,
          box: { topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] },
        });
        expect(result.wobjects).to.have.length(2);
      });
    });

    describe('for sites', async () => {
      let host, child;
      beforeEach(async () => {
        host = `${faker.random.string()}.${parent.host}`;
        child = await AppFactory.Create({
          parent: parent._id,
          host,
          supportedObjects: [wobj1.author_permlink, wobj2.author_permlink],
          status: STATUSES.ACTIVE,
        });
      });

      it('should return all wobjects if they in search box and in site supported objects ', async () => {
        result = await wobjects.searchWobjects({
          app: child,
          box: { topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] },
        });

        expect(result.wobjects).to.have.length(2);
      });

      it('should not return object if it not in supported objects', async () => {
        child = await App.findOneAndUpdate(
          { host },
          { $set: { supported_objects: [wobj1.author_permlink] } },
          { new: true },
        ).lean();
        result = await wobjects.searchWobjects({
          app: child,
          box: { topPoint: [-98.233, 48.224], bottomPoint: [-91.233, 44.224] },
        });

        const wobj = _.find(result.wobjects, { author_permlink: wobj2.author_permlink });
        expect(wobj).to.be.undefined;
      });

      describe('addHashtag test', async () => {
        let hashtag;
        beforeEach(async () => {
          hashtag = await ObjectFactory.Create({
            objectType: OBJECT_TYPES.HASHTAG,
            searchParams: { name: [faker.random.string()] },
          });
        });

        it('should return hashtag when has property addHashtag true', async () => {
          result = await wobjects.searchWobjects({
            app: child,
            addHashtag: true,
          });

          expect(_.map(result.wobjects, 'author_permlink')).to.include(hashtag.author_permlink);
        });

        it('should not return hashtag when has property addHashtag true', async () => {
          result = await wobjects.searchWobjects({ app: child });

          expect(_.map(result.wobjects, 'author_permlink')).to.not.include(hashtag.author_permlink);
        });
      });
    });
  });

  describe('hasMore test', async () => {
    let result;
    const name = faker.random.string();
    const skip = _.random(0, 3);
    const limit = _.random(5, 10);

    beforeEach(async () => {
      for (let i = 0; i < limit; i++) {
        await ObjectFactory.Create({
          objectType: OBJECT_TYPES.RESTAURANT,
          searchParams: { name: [name] },
        });
      }
    });
    describe('default search has more true', async () => {
      beforeEach(async () => {
        result = await wobjects.searchWobjects({
          string: name,
          skip,
          limit: limit - 1 - skip,
          object_type: OBJECT_TYPES.RESTAURANT,
        });
      });

      it('should hasMore be true', async () => {
        expect(result.hasMore).to.be.true;
      });

      it('should result.wobjects should have proper length', async () => {
        expect(result.wobjects).to.be.have.length(limit - 1 - skip);
      });
    });

    describe('default search has more false', async () => {
      beforeEach(async () => {
        result = await wobjects.searchWobjects({
          string: name,
          skip,
          limit: limit - skip,
          object_type: OBJECT_TYPES.RESTAURANT,
        });
      });

      it('should hasMore be false', async () => {
        expect(result.hasMore).to.be.false;
      });

      it('should result.wobjects should have proper length', async () => {
        expect(result.wobjects).to.be.have.length(limit - skip);
      });
    });

    describe('sites search has more true', async () => {
      beforeEach(async () => {
        result = await wobjects.searchWobjects({
          string: name,
          skip,
          limit: limit - 1 - skip,
          object_type: OBJECT_TYPES.RESTAURANT,
          app: parent,
        });
      });

      it('should hasMore be true', async () => {
        expect(result.hasMore).to.be.true;
      });

      it('should result.wobjects should have proper length', async () => {
        expect(result.wobjects).to.be.have.length(limit - 1 - skip);
      });
    });

    describe('sites search has more false', async () => {
      beforeEach(async () => {
        result = await wobjects.searchWobjects({
          string: name,
          skip,
          limit: limit - skip,
          object_type: OBJECT_TYPES.RESTAURANT,
          app: parent,
        });
      });

      it('should hasMore be false', async () => {
        expect(result.hasMore).to.be.false;
      });

      it('should result.wobjects should have proper length', async () => {
        expect(result.wobjects).to.be.have.length(limit - skip);
      });
    });
  });
});
