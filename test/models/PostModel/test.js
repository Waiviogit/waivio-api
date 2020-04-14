const {
  PostModel, faker, expect, sinon, Post, Mongoose, dropDatabase,
} = require('test/testHelper');
const _ = require('lodash');
const { PostFactory, ObjectFactory, AppFactory } = require('test/factories');

describe('Post Model', async () => {
  describe('On aggregate', async () => {
    let post, postsCount;
    beforeEach(async () => {
      await dropDatabase();
      postsCount = faker.random.number({ min: 5, max: 10 });
      for (let i = 0; i < postsCount; i++) {
        if (i === 0) {
          post = await PostFactory.Create();
        } else {
          await PostFactory.Create();
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
    describe('On project stage case', async () => {
      let result;
      beforeEach(async () => {
        result = await PostModel.aggregate([{
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
      });
      it('Should return from request: author, title and body', async () => {
        const { posts: [posts] } = result;
        expect(posts).to.be.deep.eq(_.pick(post, ['author', 'title', 'body']));
      });
    });
    describe('On error', async () => {
      it('Should check that the error message', async () => {
        const { error } = await PostModel.aggregate([{
          $match: {
            author: faker.name.firstName(),
          },
        }]);
        expect(error).to.be.exist;
      });
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
      limit = postsCount;
      skip = faker.random.number(limit);
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should return right count records considering limits and skips', async () => {
      const { posts } = await PostModel.getPostsRefs({ skip, limit });
      const answer = (postsCount - skip) > limit ? limit : (postsCount - skip);
      expect(posts.length).to.be.eq(answer);
    });
    it('Should return record with author, permlink, wobjects', async () => {
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
    let post, rootAuthor, countPosts;
    beforeEach(async () => {
      await dropDatabase();
      countPosts = faker.random.number({ min: 5, max: 10 });
      rootAuthor = faker.name.firstName();
      for (let i = 0; i < countPosts; i++) {
        if (i === 0) {
          post = await PostFactory.Create(
            { rootAuthor },
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
        { author: rootAuthor, permlink: post.permlink },
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
      await PostFactory.Create();
      latestPost = await PostFactory.Create({ author, wobjects });
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
  describe('On getByFollowLists', async () => {
    const permLink = [], wobjects = [];
    let post, countObjects, countPosts;
    beforeEach(async () => {
      await dropDatabase();
      countObjects = faker.random.number({ min: 4, max: 10 });
      countPosts = faker.random.number({ min: 4, max: 10 });
      for (let i = 0; i < countObjects; i++) {
        permLink.push(faker.random.string(10));
        await ObjectFactory.Create({ authorPermlink: permLink[i] });
        if (i === 1 || i === 3) wobjects.push({ author_permlink: permLink[i] });
      }
      for (let j = 0; j < countPosts; j++) {
        if (j === 0) {
          post = await PostFactory.Create({ wobjects });
        } else await PostFactory.Create();
      }
    });
    it('Should return posts where objects match', async () => {
      const { posts: [posts] } = await PostModel.getByFollowLists(
        {
          user: faker.name.firstName(),
          skip: 0,
          limit: 30,
          author_permlinks: [permLink[1], permLink[3]],
          user_languages: post.language,
        },
      );
      expect(_.omit(posts, 'fullObjects')).to.be.deep.eq(_.omit(post, 'post_id'));
    });
    describe('On error case', async () => {
      it('Should check that the error exists', async () => {
        const { error } = await PostModel.getByFollowLists({ author_permlinks: [permLink[1], permLink[3]] });
        expect(error).to.be.exist;
      });
      it('Should return error message', async () => {
        const { error } = await PostModel.getByFollowLists({ author_permlinks: [permLink[1], permLink[3]] });
        expect(error.message).to.be.eq('Posts not found!');
      });
    });
  });
  describe('On getAllPosts', async () => {
    const permLink = [], wobjects = [];
    let post, data, byApp, supportedObjects, countPosts;
    beforeEach(async () => {
      await dropDatabase();
      countPosts = faker.random.number({ min: 3, max: 15 });
      for (let i = 0; i < 2; i++) {
        permLink.push(faker.random.string(10));
        wobjects.push({ author_permlink: permLink[i] });
        await ObjectFactory.Create({ authorPermlink: permLink[i] });
      }
      for (let i = 0; i < countPosts; i++) {
        if (i === 0) {
          post = await PostFactory.Create({ wobjects });
        } else { await PostFactory.Create(); }
      }
      supportedObjects = [permLink[0], permLink[1]];
      byApp = (await AppFactory.Create({ supportedObjects })).name;
      data = { skip: 0, limit: 30, filter: { byApp } };
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should return posts based on the filter', async () => {
      const { posts: [posts] } = await PostModel.getAllPosts(data);
      expect(_.omit(posts, 'fullObjects')).to.be.deep.eq(_.omit(post, 'post_id'));
    });
    it('Should return the number of all posts', async () => {
      const { posts: [...posts] } = await PostModel.getAllPosts(_.omit(data, 'filter'));
      expect(posts.length).to.be.eq(countPosts);
    });
    it('Should check that the error exist', async () => {
      sinon.stub(Post, 'aggregate').throws('Database is not responding');
      const { error } = await PostModel.getAllPosts(_.omit(data, 'filter'));
      expect(error).to.be.exist;
    });
  });
  describe('On fillObjects', async () => {
    const wobjectsCreated = [];
    let posts, objectsCount, result, wobjects = [];
    beforeEach(async () => {
      await dropDatabase();
      objectsCount = faker.random.number({ min: 2, max: 10 });
      for (let i = 0; i < objectsCount; i++) {
        wobjects.push({ author_permlink: faker.random.string(10) });
        wobjectsCreated.push(await ObjectFactory.Create(
          { authorPermlink: wobjects[i].author_permlink },
        ));
      }
      for (let j = 0; j < 2; j++) {
        await PostFactory.Create(
          {
            wobjects,
          },
        );
      }
      posts = (await PostModel.getAllPosts({ skip: 0, limit: 30 })).posts;
      result = await PostModel.fillObjects(posts);
    });
    afterEach(async () => {
      wobjects = [];
    });
    it('Should return full objects in posts objects', async () => {
      expect(result[0].wobjects[0]).to.be.deep.eq(_.omit(wobjectsCreated[0], 'id'));
    });
    it('Should return the specified number of objects  ', async () => {
      expect(result[0].wobjects.length).to.be.eq(objectsCount);
    });
  });
});
