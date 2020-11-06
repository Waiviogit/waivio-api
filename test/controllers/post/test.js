const {
  faker, chai, expect, dropDatabase, app, sinon,
} = require('test/testHelper');
const {
  AppFactory, PostFactory, UsersFactory, AppendObjectFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { FIELDS_NAMES } = require('constants/wobjectsData');

describe('On postController', async () => {
  let currentApp, session, result, post;
  beforeEach(async () => {
    await dropDatabase();
    currentApp = await AppFactory.Create({ status: STATUSES.ACTIVE });
    session = getNamespace('request-session');
    sinon.stub(session, 'get').returns(currentApp.host);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('on getSocialInfo', async () => {
    describe('on ok', async () => {
      let social, user, wobject;
      const twitter = faker.random.string();
      const facebook = faker.random.string();
      const city = faker.random.string();
      beforeEach(async () => {
        ({ wobject } = await AppendObjectFactory.Create({
          name: FIELDS_NAMES.ADDRESS,
          body: JSON.stringify({ city }),
        }));
        ({ wobject } = await AppendObjectFactory.Create({
          name: FIELDS_NAMES.LINK,
          body: JSON.stringify({ linkFacebook: facebook, linkTwitter: twitter }),
          rootWobj: wobject.author_permlink,
        }));
        post = await PostFactory.Create({ wobjects: [wobject] });
        user = await UsersFactory
          .Create({ posting_json_metadata: JSON.stringify({ profile: { twitter, facebook } }) });
      });
      it('should have status 200', async () => {
        social = 'facebook';
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: post.author, permlink: post.permlink, userName: user.name, social,
          });
        expect(result).to.have.status(200);
      });
      it('should have same userSocial facebook', async () => {
        social = 'facebook';
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: post.author, permlink: post.permlink, userName: user.name, social,
          });
        expect(result.body.userSocial).to.be.eq(facebook);
      });
      it('should have same userSocial twitter', async () => {
        social = 'twitter';
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: post.author, permlink: post.permlink, userName: user.name, social,
          });
        expect(result.body.userSocial).to.be.eq(twitter);
      });
      it('should be city in response cities array', async () => {
        social = 'twitter';
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: post.author, permlink: post.permlink, userName: user.name, social,
          });
        expect(result.body.cities).to.be.deep.eq([city]);
      });
      it('should be same linkFacebook and wobjectsSocial', async () => {
        social = 'facebook';
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: post.author, permlink: post.permlink, userName: user.name, social,
          });
        expect(result.body.wobjectsSocial).to.be.deep.eq([facebook]);
      });
      it('should be same linkTwitter and wobjectsSocial', async () => {
        social = 'twitter';
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: post.author, permlink: post.permlink, userName: user.name, social,
          });
        expect(result.body.wobjectsSocial).to.be.deep.eq([twitter]);
      });
      it('should be deep equal tags', async () => {
        social = 'twitter';
        const mock = ['HIVE', 'waivio', wobject.default_name];
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: post.author, permlink: post.permlink, userName: user.name, social,
          });
        expect(result.body.tags).to.be.deep.eq(mock);
      });
    });
    describe('on error', async () => {
      it('should have status 422', async () => {
        result = await chai.request(app)
          .get('/api/post/social-info');
        expect(result).to.have.status(422);
      });
      it('should have status 404', async () => {
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: faker.random.string(),
            permlink: faker.random.string(),
            userName: faker.random.string(),
            social: 'facebook',
          });
        expect(result).to.have.status(404);
      });
    });
  });
});
