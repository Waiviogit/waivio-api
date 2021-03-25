const {
  faker, chai, expect, dropDatabase, app, sinon,
} = require('test/testHelper');
const {
  AppFactory, PostFactory, UsersFactory, AppendObjectFactory, ObjectFactory,
} = require('test/factories');
const { getNamespace } = require('cls-hooked');
const { STATUSES } = require('constants/sitesConstants');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const _ = require('lodash');
const { IGNORED_AUTHORS } = require('../../../constants/postsData');
const hotTrandGetter = require('../../../utilities/operations/post/feedCache/hotTrandGetter');

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
      let wobject, hashtag;
      const twitter = faker.random.string();
      const facebook = faker.random.string();
      const city = faker.random.string();
      const author = faker.random.string();
      beforeEach(async () => {
        hashtag = await ObjectFactory.Create({ objectType: 'hashtag' });
        ({ wobject } = await AppendObjectFactory.Create({
          name: FIELDS_NAMES.ADDRESS,
          body: JSON.stringify({ city }),
        }));
        await AppendObjectFactory.Create({
          name: FIELDS_NAMES.LINK,
          body: JSON.stringify({ linkFacebook: facebook, linkTwitter: twitter }),
          rootWobj: wobject.author_permlink,
        });
        post = await PostFactory.Create({ author, wobjects: [wobject, hashtag] });
        await UsersFactory
          .Create({
            name: author,
            posting_json_metadata: JSON.stringify({ profile: { twitter, facebook } }),
          });
        result = await chai.request(app)
          .get('/api/post/social-info')
          .query({
            author: post.author, permlink: post.permlink,
          });
      });
      it('should have status 200', async () => {
        expect(result).to.have.status(200);
      });
      it('should have same fields like mock', async () => {
        const mock = {
          tags: [hashtag.default_name, 'HIVE', 'waivio'],
          cities: [city],
          userFacebook: facebook,
          userTwitter: twitter,
          wobjectsTwitter: [twitter],
          wobjectsFacebook: [facebook],
        };
        expect(result.body).to.be.deep.eq(mock);
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
          });
        expect(result).to.have.status(404);
      });
    });
  });

  describe('on getPostsByCategory', async () => {
    const counter = _.random(2, 9);
    const postsIds = [];
    beforeEach(async () => {
      await dropDatabase();
      for (let i = 0; i < counter; i++) {
        const newPost = await PostFactory.Create({
          author: _.sample([faker.name.firstName().toLowerCase(), IGNORED_AUTHORS[0]]),
        });
        postsIds.push(newPost._id.toString());
      }
    });
    afterEach(() => {
      sinon.restore();
    });
    it('Should return posts without ignored author from Redis', async () => {
      sinon.stub(hotTrandGetter, 'getTopFromArrays').returns(postsIds);
      hotTrandGetter.getTopFromArrays(postsIds);

      result = await chai.request(app)
        .post('/api/posts/')
        .send({
          category: 'trending',
          limit: 10,
          skip: 0,
          user_languages: ['en-US'],
        });
      result.body.forEach(
        (element) => expect(element.author).to.be.not.include(IGNORED_AUTHORS[0]),
      );
    });

    it('Should return posts without ignored author from MongoDB', async () => {
      result = await chai.request(app)
        .post('/api/posts/')
        .send({
          category: 'trending',
          limit: 10,
          skip: 0,
          user_languages: ['en-US'],
        });
      result.body.forEach(
        (element) => expect(element.author).to.be.not.include(IGNORED_AUTHORS[0]),
      );
    });
  });
});
