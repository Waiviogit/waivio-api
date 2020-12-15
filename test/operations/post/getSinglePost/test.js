const {
  expect, dropDatabase, faker, sinon, postsUtil, _, Post,
} = require('test/testHelper');
const { getNamespace } = require('cls-hooked');
const { PostFactory, AppFactory, CommentFactory } = require('test/factories');
const getSinglePost = require('utilities/operations/post/getSinglePost');

describe('On getSinglePost', async () => {
  let app, moderator;
  beforeEach(async () => {
    await dropDatabase();
    moderator = faker.name.firstName();
    app = await AppFactory.Create({ moderators: [moderator] });
    const session = getNamespace('request-session');
    sinon.stub(session, 'get').returns(app.host);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('On post', async () => {
    describe('without moderator downvote', async () => {
      let post;
      beforeEach(async () => {
        post = await PostFactory.Create({
          active_votes: [
            { percent: _.random(100, 1000), voter: faker.random.string(), weight: 0 }],
        });
        sinon.stub(postsUtil, 'getPost').returns(
          Promise.resolve({ post: Object.assign(post, { percent_steem_dollars: _.random(100, 1000) }) }),
        );
      });
      it('should return correct post', async () => {
        const { post: result } = await getSinglePost({ author: post.author, permlink: post.permlink });
        expect(post.author).to.be.eq(result.author);
      });
      it('should merge db post with hive post', async () => {
        await getSinglePost({ author: post.author, permlink: post.permlink });
        expect(post.percent_steem_dollars).to.be.exist;
      });
      it('should return error if post not exist in hive', async () => {
        sinon.restore();
        sinon.stub(postsUtil, 'getPost').returns({ error: { status: 404 } });
        const { error } = await getSinglePost({ author: post.author, permlink: post.permlink });
        expect(error.status).to.be.eq(404);
      });
      it('should return hive post even if it not exist in DB', async () => {
        await Post.deleteOne({ _id: post._id });
        const { post: result } = await getSinglePost({ author: post.author, permlink: post.permlink });
        expect(result.author).to.be.eq(post.author);
      });
    });
    describe('with moderator downvote', async () => {
      let post;
      beforeEach(async () => {
        post = await PostFactory.Create({ blocked: [app.host] });
        sinon.stub(postsUtil, 'getPost').returns(Promise.resolve({ post }));
      });
      it('should not return post which was downvoted by moderator', async () => {
        const { error } = await getSinglePost({ author: post.author, permlink: post.permlink });
        expect(error.status).to.be.eq(404);
      });
      it('should not find post in hive', async () => {
        await getSinglePost({ author: post.author, permlink: post.permlink });
        expect(postsUtil.getPost.notCalled).to.be.true;
      });
    });
  });
  describe('On comment', async () => {
    describe('Hive user comment', async () => {
      describe('without moderator downvote', async () => {
        let author, permlink;
        beforeEach(async () => {
          author = faker.random.string();
          permlink = faker.random.string();
          sinon.stub(postsUtil, 'getPost').returns(
            Promise.resolve({
              post: {
                author,
                permlink,
                parent_author: faker.random.string(),
                percent_steem_dollars: _.random(100, 1000),
                active_votes: [
                  { percent: _.random(100, 1000), voter: faker.random.string(), weight: 0 }],
              },
            }),
          );
        });
        it('should return comment from hive', async () => {
          const { post } = await getSinglePost({ author, permlink });
          expect(post.author).to.be.eq(author);
        });
      });
      describe('with moderator downvote', async () => {
        let author, permlink;
        beforeEach(async () => {
          author = faker.random.string();
          permlink = faker.random.string();
          sinon.stub(postsUtil, 'getPost').returns(
            Promise.resolve({
              post: {
                author,
                permlink,
                parent_author: faker.random.string(),
                percent_steem_dollars: _.random(100, 1000),
                active_votes: [
                  { percent: _.random(-100, -1000), voter: moderator, weight: 0 }],
              },
            }),
          );
        });
        it('should return 404 error if comment downvoted by moderator', async () => {
          const { error } = await getSinglePost({ author, permlink });
          expect(error.status).to.be.eq(404);
        });
      });
    });

    describe('guest comment', async () => {
      let author, permlink, guestName;
      beforeEach(async () => {
        guestName = faker.random.string();
        author = faker.random.string();
        permlink = faker.random.string();
        await CommentFactory.Create({ author, permlink, guestInfo: { userId: guestName } });
        sinon.stub(postsUtil, 'getPost').returns(
          Promise.resolve({
            post: {
              author,
              permlink,
              parent_author: faker.random.string(),
              percent_steem_dollars: _.random(100, 1000),
              active_votes: [
                { percent: _.random(-100, -1000), voter: moderator, weight: 0 }],
            },
          }),
        );
      });
      it('should return error if moderator downvote guest comment', async () => {
        const { error } = await getSinglePost({ author: guestName, permlink });
        expect(error.status).to.be.eq(404);
      });
    });
  });
});
