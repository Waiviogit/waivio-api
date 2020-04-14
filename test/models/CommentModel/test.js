const {
  expect, CommentModel, faker, sinon, Comment,
} = require('test/testHelper');
const { CommentFactory } = require('test/factories');
const _ = require('lodash');

describe('Comment Model', async () => {
  describe('On getOne', async () => {
    let comment, commentCount, nameAuthor;
    beforeEach(async () => {
      commentCount = 6;
      nameAuthor = faker.name.firstName();
      for (let iteration = 0; iteration < commentCount; iteration++) {
        if (iteration === 0) comment = await CommentFactory.Create({ author: nameAuthor });
        else await CommentFactory.Create();
      }
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('Should check comment for identity using author key', async () => {
      const { comment: receivedComment } = await CommentModel.getOne(
        _.pick(comment, 'author', 'permlink'),
      );
      expect(receivedComment).to.be.deep.eq(comment);
    });
    it('Should check comment for identity using userId key ', async () => {
      const { comment: receivedComment } = await CommentModel.getOne(
        _.pick(comment, 'userId', 'permlink'),
      );
      expect(receivedComment).to.be.deep.eq(comment);
    });
    it('Should return null comment', async () => {
      const { comment: receivedComment } = await CommentModel.getOne(
        { author: faker.name.firstName() },
      );
      expect(receivedComment).to.be.null;
    });
    it('Should check that the error exists', async () => {
      sinon.stub(Comment, 'findOne').throws('DataBase is not responding');
      const { error } = await CommentModel.getOne({ author: faker.name.firstName() });
      expect(error).to.be.exist;
    });
  });
  describe('On findByCond and getMany', async () => {
    let commentCount, answerCount, nameAuthor;
    beforeEach(async () => {
      nameAuthor = faker.name.firstName();
      commentCount = faker.random.number({ min: 5, max: 15 });
      answerCount = 0;
      for (let iteration = 0; iteration < commentCount; iteration++) {
        if (iteration % 2) await CommentFactory.Create();
        else {
          answerCount++;
          await CommentFactory.Create({ author: nameAuthor });
        }
      }
    });
    afterEach(async () => {
      sinon.restore();
    });
    describe('On findByCond', async () => {
      it('Should return right count records by current author', async () => {
        const { result } = await CommentModel.findByCond({ author: nameAuthor });
        expect(result.length).to.be.eq(answerCount);
      });
      it('Should return empty array of comments', async () => {
        const { result } = await CommentModel.findByCond({ author: faker.name.firstName() });
        expect(result).to.be.empty;
      });
      it('Should check that the error exists', async () => {
        sinon.stub(Comment, 'find').throws('DataBase is not responding');
        const { error } = await CommentModel.findByCond({ author: faker.name.firstName() });
        expect(error).to.be.exist;
      });
    });
    describe('On getMany', async () => {
      let limit, skip, answer;
      beforeEach(async () => {
        limit = faker.random.number(answerCount);
        skip = faker.random.number(limit);
        answer = (answerCount - skip) > limit ? limit : (answerCount - skip);
      });
      it('Should return right count records considering limits and skips', async () => {
        const { comments } = await CommentModel.getMany(
          { cond: { author: nameAuthor }, limit, skip },
        );
        expect(comments.length).to.be.eq(answer);
      });
      it('Should check that the error exists', async () => {
        const { error } = await CommentModel.getMany({ cond: { author: nameAuthor }, skip: -1 });
        expect(error).to.be.exist;
      });
    });
  });
});
