const {
  expect, SubscriptionModel, Subscriptions, dropDatabase, faker,
} = require('test/testHelper');
const { SubscriptionsFactory } = require('test/factories');

describe('Subscription Model', async () => {
  describe('On followUser', async () => {
    let follower, following, dbEntry, newSubscription, sameSubscription, missedArgumentSubscription;
    beforeEach(async () => {
      await dropDatabase();
      ({ follower, following } = await SubscriptionsFactory.Create({ onlyData: true }));
      newSubscription = await SubscriptionModel.followUser({ follower, following });
      missedArgumentSubscription = await SubscriptionModel.followUser({ follower });
      sameSubscription = await SubscriptionModel.followUser({ follower, following });
      dbEntry = await Subscriptions.findOne({ follower, following });
    });
    it('database entry should exist', async () => {
      expect(dbEntry).to.be.exist;
    });
    it('database entry follower arguments should and be equal ', async () => {
      expect(dbEntry.follower).to.be.equal(follower);
    });
    it('database entry following and arguments should be equal ', async () => {
      expect(dbEntry.following).to.be.equal(following);
    });
    it('new subscription should return true', async () => {
      expect(newSubscription.result).to.be.equal(true);
    });
    it('wrong subscription should return false', async () => {
      expect(missedArgumentSubscription.error).to.be.exist;
    });
    it('same subscription should return error', async () => {
      expect(sameSubscription.error).to.be.exist;
    });
  });
  describe('On unfollowUser', async () => {
    let follower, following, result;
    beforeEach(async () => {
      await dropDatabase();
      ({ follower, following } = await SubscriptionsFactory.Create());
    });
    it('deleting with valid data should return true', async () => {
      ({ result } = await SubscriptionModel.unfollowUser({ follower, following }));
      expect(result).to.be.equal(true);
    });
    it('deleting with not valid data should return false', async () => {
      ({ result } = await SubscriptionModel.unfollowUser({
        follower: faker.name.firstName(),
        following: faker.name.firstName(),
      }));
      expect(result).to.be.equal(false);
    });
  });
  describe('On findOne', async () => {
    let follower, following, subscription, wrongData;
    beforeEach(async () => {
      await dropDatabase();
      ({ follower, following } = await SubscriptionsFactory.Create());
      ({ subscription } = await SubscriptionModel.findOne({ condition: { follower, following } }));
      wrongData = await SubscriptionModel.findOne({
        condition: { follower: faker.name.firstName(), following: faker.name.firstName() },
      });
    });
    it('database entry should exist', async () => {
      expect(subscription).to.be.exist;
    });
    it('database entry field follower should be same as argument', async () => {
      expect(subscription.follower).to.be.equal(follower);
    });
    it('database entry field following should be same as argument', async () => {
      expect(subscription.following).to.be.equal(following);
    });
    it('wrongData should return null', async () => {
      expect(wrongData.subscription).to.be.equal(null);
    });
  });
});
