const _ = require('lodash');
const {
  faker, dropDatabase, campaignsHelper, expect, moment,
} = require('test/testHelper');
const {
  CampaignFactory, PostFactory, UsersFactory, ObjectFactory, AppFactory,
} = require('test/factories');
const sinon = require('sinon');
const { Wobj } = require('models/index');

describe('Ob addCampaignsToWobjects', async () => {
  let name, user, wobjects, budget, minreward, maxreward, objects, requiredObject, permlink, app;
  describe('For primaryCampaigns', async () => {
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      user = await UsersFactory.Create({ name });
      permlink = faker.random.word();
      wobjects = [await ObjectFactory.Create({
        _id: faker.random.string(24),
        authorPermlink: permlink,
        object_type: faker.random.word(),
        weight: _.random(0, 10),
      }),
      ];
      // obj = await ObjectFactory.Create({
      //   author_permlink: permlink,
      //   object_type: faker.random.word(),
      // });
      budget = _.random(500, 1000);
      minreward = _.random(10, 50);
      maxreward = _.random(50, 100);
      objects = [permlink, faker.random.word(), faker.random.word(), faker.random.word()];
      requiredObject = permlink;
      await CampaignFactory.Create({
        budget, reward: minreward, objects, requiredObject, status: 'active',
      });
      await CampaignFactory.Create({
        budget, reward: maxreward, objects, requiredObject, status: 'active',
      });
      await campaignsHelper.addCampaignsToWobjects({ wobjects, user });
    });
    it('Should add new field \'campaigns\'', async () => {
      expect(wobjects[0]).to.have.own.property('campaigns');
    });
    it('Should add correct value to \'campaigns\'', async () => {
      expect(wobjects[0].campaigns).to.be.deep.eq({
        min_reward: minreward, max_reward: maxreward,
      });
    });
  });
  describe('For secondaryCampaigns', async () => {
    let perm;
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      user = await UsersFactory.Create({ name });
      permlink = faker.random.word();
      perm = faker.random.word();
      wobjects = [
        await ObjectFactory.Create({
          authorPermlink: permlink,
          objectType: faker.random.word(),
          weight: _.random(0, 10),
        }),
        await ObjectFactory.Create({
          authorPermlink: perm,
          objectType: faker.random.word(),
          weight: _.random(0, 10),
        }),
      ];
      budget = _.random(500, 1000);
      minreward = _.random(10, 50);
      maxreward = _.random(50, 100);
      requiredObject = permlink;
      objects = [permlink, perm, faker.random.word(), faker.random.word(), faker.random.word()];
      await CampaignFactory.Create({
        budget, reward: minreward, objects, status: 'active', requiredObject, guideName: name,
      });
    });
    it('Should add new field \'propositions\' to wobject', async () => {
      await campaignsHelper.addCampaignsToWobjects({ wobjects, user });
      expect(wobjects[1]).to.have.own.property('propositions');
    });
    it('\'propositions\' should not to be empty', async () => {
      await campaignsHelper.addCampaignsToWobjects({ wobjects, user });
      expect(wobjects[1].propositions).to.not.be.empty;
    });
  });
  describe('Errors', async () => {
    beforeEach(async () => {
      await dropDatabase();
      name = faker.name.firstName();
      user = await UsersFactory.Create({ name });
      permlink = faker.random.word();
      wobjects = [
        {
          _id: faker.random.string(24),
          author_permlink: permlink,
          object_type: faker.random.word(),
          weight: _.random(0, 10),
        },
      ];
      budget = _.random(70);
      minreward = _.random(51, 60);
      maxreward = _.random(61, 70);
      objects = [permlink, faker.random.word(), faker.random.word(), faker.random.word()];
      requiredObject = permlink;
      await CampaignFactory.Create({
        budget, reward: minreward, objects, requiredObject, status: 'active',
      });
      await CampaignFactory.Create({
        budget, reward: maxreward, objects, requiredObject, status: 'active',
      });
    });
    it('Should return the error message \'Reward more than budget\'', async () => {
      sinon.spy(console, 'error')
      const error = await campaignsHelper.addCampaignsToWobjects({ wobjects, user });
      console.log(error)
      expect(error).to.be.throw;
    });
  });
});
