const {
  PostModel, faker, expect, sinon, Post, Mongoose,
} = require('test/testHelper');
const _ = require('lodash');
const { PostFactory, wObjectFactory } = require('test/factories');

describe('Post Model', async () => {
  describe('On aggregate', async () => {
    let post, author, permlink, title, body, postsCount;
    beforeEach(async () => {
      author = faker.name.firstName();
      permlink = faker.random.string(20);
      title = faker.address.city();
      body = faker.lorem.sentence();
      postsCount = faker.random.number(30);
      for (let i = 0; i < postsCount; i++) {
        if (i === 0) {
          post = await PostFactory.Create({
            author, permlink, title, body,
          });
        } else {
          await PostFactory.Create({
          });
        }
      }
    });
    describe('On group stage case', async () => {
      let result;
      beforeEach(async () => {
        result = await PostModel.aggregate([{
          $group: {
            _id: '$_id',
            author: { $first: '$author' },
            permlink: { $first: '$permlink' },
            title: { $first: '$title' },
            body: { $first: '$body' },
          },
        }]);
      });
      it('Should return right count posts', async () => {
        const { posts } = result;
        expect(posts.length).to.be.eq(postsCount);
      });
      it('Should return records with id, author, perlink, title and body ', async () => {
        const { posts: [posts] } = result;
        expect(posts).to.have.all.keys(
          '_id', 'author', 'permlink', 'title', 'body',
        );
      });
    });

    it('Should return from request: author, title and body', async () => {
      const result = await PostModel.aggregate([{
        $match: {
          author: post.author,
        },
      },
      {
        $project: {
          _id: 0, author: 1, title: 1, body: 1,
        },
      },
      ]);
      const { posts: [posts] } = result;
      expect(posts).to.be.deep.eq(_.pick(post, ['author', 'title', 'body']));
    });
    it('Should check that the error message', async () => {
      const { error } = await PostModel.aggregate([{
        $match: {
          author: faker.name.firstName(),
        },
      }]);
      expect(error).to.be.exist;
    });
  });
  describe('On getPostsRefs', async () => {
    let skip, limit, postsCount;
    beforeEach(async () => {
      postsCount = faker.random.number(50);
      for (let i = 0; i < postsCount; i++) {
        await PostFactory.Create();
      }
      limit = faker.random.number(postsCount);
      skip = faker.random.number(limit);
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should return right count records considering limits and skips', async () => {
      const { posts } = await PostModel.getPostsRefs({ skip, limit });
      const answer = postsCount - skip >= limit ? limit : postsCount - skip;
      expect(posts.length).to.be.eq(answer);
    });
    it('Should check that the error exists', async () => {
      sinon.stub(Post, 'aggregate').throws('Database is not responding');
      const { error } = await PostModel.getPostsRefs();
      expect(error).to.be.exist;
    });
  });
  describe('On getOne', async () => {
    let post, postCount, nameAuthor;
    beforeEach(async () => {
      postCount = 6;
      nameAuthor = faker.name.firstName();
      for (let iteration = 0; iteration < postCount; iteration++) {
        if (iteration === 0) post = await PostFactory.Create({ author: nameAuthor });
        else await PostFactory.Create();
      }
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should check post for identity using author key', async () => {
      const { post: receivedPost } = await PostModel.getOne(
        _.pick(post, 'author', 'permlink'),
      );
      expect(receivedPost).to.be.deep.eq(_.omit(post, 'post_id'));
    });
    it('Should check post for identity using root_author key ', async () => {
      const { post: receivedPost } = await PostModel.getOne(
        _.pick(post, 'root_author', 'permlink'),
      );
      expect(receivedPost).to.be.deep.eq(_.omit(post, 'post_id'));
    });
    it('Should return null post when request name cannot be found', async () => {
      const { post: receivedPost } = await PostModel.getOne(
        { author: faker.name.firstName() },
      );
      expect(receivedPost).to.be.null;
    });
    it('Should check that the error exists', async () => {
      sinon.stub(Post, 'findOne').throws('DataBase is not responding');
      const { error } = await PostModel.getOne({ author: faker.name.firstName() });
      expect(error).to.be.exist;
    });
  });
  describe('On findByBothAuthors', async () => {
    let post, nameAuthor, userPermlink, rootAuthor, countPosts;
    beforeEach(async () => {
      countPosts = faker.random.number(30);
      nameAuthor = faker.name.firstName();
      userPermlink = faker.random.string(10);
      rootAuthor = { author: nameAuthor, permlink: userPermlink };
      for (let i = 0; i < countPosts; i++) {
        if (i === 0) {
          post = await PostFactory.Create(
            { author: nameAuthor, permlink: userPermlink, rootAuthor },
          );
        } else if (i === 1) await PostFactory.Create({ rootAuthor });
        else await PostFactory.Create();
      }
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should return the requested post if the parameters match', async () => {
      const { result: [result] } = await PostModel.findByBothAuthors(
        { author: nameAuthor, permlink: userPermlink },
      );
      console.log(result);
      expect(result).to.be.deep.eq(_.omit(post, 'post_id'));
    });
    it('Should return empty array when request params cannot be found', async () => {
      const { result } = await PostModel.findByBothAuthors(
        { author: faker.name.findName(), permlink: faker.random.string(10) },
      );
      expect(result).to.be.empty;
    });
    it('Should check that the error exists', async () => {
      sinon.stub(Post, 'find').throws('DataBase is not responding');
      const { error } = await PostModel.findByBothAuthors(
        { author: faker.name.findName(), permlink: faker.random.string(10) },
      );
      expect(error).to.be.exist;
    });
  });
  describe('On getBlog', async () => {
    let author, permLink, permLink2, latestPosts, countWobj, countPosts, latestPost, wObjects;
    beforeEach(async () => {
      countWobj = faker.random.number(10);
      countPosts = faker.random.number(10);
      latestPosts = new Mongoose.Types.ObjectId();
      author = faker.name.firstName();
      permLink = faker.random.string(10);
      permLink2 = faker.random.string(10);
      wObjects = [{ author_permlink: permLink }, { author_permlink: permLink2 }];
      for (let i = 0; i < countWobj; i++) {
        if (i === 0) {
          await wObjectFactory.Create(
            { author: faker.name.firstName(), authorPermlink: permLink, latestPosts },
          );
          await wObjectFactory.Create(
            { author: faker.name.firstName(), authorPermlink: permLink2, latestPosts },
          );
        } else {
          await wObjectFactory.Create(
            { author, authorPermlink: faker.random.string(10) },
          );
        }
      }
      for (let j = 0; j < countPosts; j++) {
        if (j % 2) await PostFactory.Create({ author, wobjects: wObjects });
        else if (j === countPosts - 1) {
          latestPost = await PostFactory.Create({ author, wobjects: wObjects });
        } else await PostFactory.Create({ author: faker.name.firstName() });
      }
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should return posts indicated author', async () => {
      const { posts: [posts] } = await PostModel.getBlog({ name: author });
      expect(_.omit(posts, 'fullObjects')).to.be.deep.eq(_.omit(latestPost, 'post_id'));
    });
    it('Should return empty array if indicated author not found', async () => {
      const { posts } = await PostModel.getBlog({ name: faker.name.firstName() });
      expect(posts).to.be.empty;
    });
    it('Should check that the error exists', async () => {
      sinon.stub(Post, 'find').throws('DataBase is not responding');
      const { error } = await PostModel.getBlog({ name: faker.name.firstName() });
      expect(error).to.be.exist;
    });
  });
  describe('On getManyPosts', async () => {
    const author = [], permlink = [];
    let postsRefs, postsCount, countResult = 0;
    beforeEach(async () => {
      for (let i = 0; i < faker.random.number({ min: 10, max: 20 }); i++) {
        author.push(faker.name.firstName());
        permlink.push(faker.random.string(10));
      }
      postsCount = author.length * 2;
      postsRefs = [
        { author: author[3], permlink: permlink[3] }, { author: author[7], permlink: permlink[7] },
      ];
      for (let i = 0; i < postsCount; i++) {
        if (i === 3 || i === 7) {
          await PostFactory.Create({ author: author[i], permlink: permlink[i] });
          countResult++;
        } else {
          await PostFactory.Create(
            { author: faker.name.firstName(), permlink: faker.random.string(10) },
          );
        }
      }
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should return posts by parameters of posts refs', async () => {
      const { posts } = await PostModel.getManyPosts(postsRefs);
      expect(posts.length).to.be.eq(countResult);
    });
    it('Should return empty array if post not found for provided posts refs', async () => {
      const postsRefsNull = [
        { author: author[1], permlink: permlink[1] }, { author: author[9], permlink: permlink[9] },
      ];
      const { posts } = await PostModel.getManyPosts(postsRefsNull);
      expect(posts).to.be.empty;
    });
    it('Should check that the error exists', async () => {
      sinon.stub(Post, 'find').throws('DataBase is not responding');
      const { error } = await PostModel.getManyPosts(postsRefs);
      expect(error).to.be.exist;
    });
  });
});
