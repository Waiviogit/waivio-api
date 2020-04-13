const {
  PostModel, faker, expect, sinon, Post, Mongoose, dropDatabase,
} = require('test/testHelper');
const _ = require('lodash');
const { PostFactory, wObjectFactory, AppFactory } = require('test/factories');

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
        if (j === 0) await PostFactory.Create({ author, wobjects: wObjects });
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
  describe('On getByFollowLists', async () => {
    const permLink = [], wobjects = [];
    let post, countObjects, countPosts;
    beforeEach(async () => {
      await dropDatabase();
      countObjects = faker.random.number({ min: 4, max: 10 });
      countPosts = faker.random.number({ min: 4, max: 10 });
      for (let i = 0; i < countObjects; i++) {
        permLink.push(faker.random.string(10));
        await wObjectFactory.Create({ authorPermlink: permLink[i] });
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
        await wObjectFactory.Create({ authorPermlink: permLink[i] });
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
    let wobjects = [], wobjectsCreated = [];
    let posts, objectsCount, result;
    beforeEach(async () => {
      await dropDatabase();
      objectsCount = faker.random.number({ min: 2, max: 10 });
      for (let i = 0; i < objectsCount; i++) {
        wobjects.push({ author_permlink: faker.random.string(10) });
        wobjectsCreated.push(await wObjectFactory.Create({ authorPermlink: wobjects[i].author_permlink }));
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
      console.log(result[0]);
      expect(result[0].wobjects.length).to.be.eq(objectsCount);
    });
  });
});
