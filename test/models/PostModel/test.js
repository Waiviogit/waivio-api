const {
  PostModel, faker, expect, sinon, Post, Mongoose, dropDatabase,
} = require('test/testHelper');
const _ = require('lodash');
const { PostFactory, ObjectFactory } = require('test/factories');

describe('Post Model', async () => {
  describe('On aggregate', async () => {
    let post, author, permlink, title, body, postsCount;
    beforeEach(async () => {
      await dropDatabase();
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
      it('Should return record with id, author, perlink, title and body ', async () => {
        const { posts: [firstPost] } = result;
        expect(firstPost).to.have.all.keys('_id', 'author', 'permlink', 'title', 'body');
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
      await dropDatabase();
      postsCount = faker.random.number({ min: 10, max: 15 });
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
    it('Should return record with author, perlink, wobjects', async () => {
      const { posts: [firstPost] } = await PostModel.getPostsRefs({ skip, limit });
      expect(firstPost).to.have.all.keys('author', 'permlink', 'wobjects');
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
      await dropDatabase();
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
    it('Should return null when post cannot be found', async () => {
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
      await dropDatabase();
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
      expect(result).to.be.deep.eq(_.omit(post, 'post_id'));
    });
    it('Should return empty array when post dont found', async () => {
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
    const wobjects = [];
    let author, latestPost;
    beforeEach(async () => {
      await dropDatabase();
      author = faker.name.firstName();
      for (let i = 0; i < 10; i++) {
        if (i === 0 && i === 1) {
          const permlink = faker.random.string(10);
          await ObjectFactory.Create(
            { authorPermlink: permlink, latestPosts: [new Mongoose.Types.ObjectId()] },
          );
          wobjects.push({ author_permlink: permlink });
        } else await ObjectFactory.Create();
      }
      for (let j = 0; j < 10; j++) {
        if (j === 0) await PostFactory.Create({ author, wobjects });
        else if (j === 10 - 1) {
          latestPost = await PostFactory.Create({ author, wobjects });
        } else await PostFactory.Create();
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
    const postsRefs = [];
    beforeEach(async () => {
      await dropDatabase();
      for (let i = 0; i < 10; i++) {
        if (i === 3 || i === 7) {
          const post = await PostFactory.Create();
          postsRefs.push({ author: post.author, permlink: post.permlink });
        } else await PostFactory.Create();
      }
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should return posts by parameters of posts refs', async () => {
      const { posts } = await PostModel.getManyPosts(postsRefs);
      expect(posts.length).to.be.eq(2);
    });
    it('Should return empty array if post not found for provided posts refs', async () => {
      const postsRefsNull = [
        { author: faker.name.firstName(), permlink: faker.random.string(10) },
        { author: faker.name.firstName(), permlink: faker.random.string(10) },
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
