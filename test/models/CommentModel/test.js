const {
  expect, CommentModel, faker, sinon, Mongoose,
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
        else await CommentFactory.Create({});
      }
    });
    it('Should check comment for identity using author key', async () => {
      const result = await CommentModel.getOne({ ..._.pick(comment, 'author', 'permlink') });
      expect(result.comment).to.deep.eq(comment);
    });
    it('Should check comment for identity using userId key ', async () => {
      const result = await CommentModel.getOne({ ..._.pick(comment, 'permlink', 'userId') });
      expect(result.comment).to.deep.eq(comment);
    });
    it('Should return null comment', async () => {
      const result = await CommentModel.getOne({ author: faker.name.firstName() });
      expect(result.comment).to.be.null;
    });
    it('Should check that the error exists', async () => {
      sinon.stub(Mongoose.Model, 'findOne').throws('DataBase is not responding');
      const result = await CommentModel.getOne({ author: faker.name.firstName() });
      expect(result.error).to.be.exist;
    });
  });
  describe('On findByCond and getMany functions case', async () => {
    let commentCount, ansverCount, nameAuthor;
    beforeEach(async () => {
      nameAuthor = faker.name.firstName();
      commentCount = faker.random.number(100);
      ansverCount = 0;
      for (let iteration = 0; iteration < commentCount; iteration++) {
        if (iteration % 2) await CommentFactory.Create({ });
        else {
          ansverCount++;
          await CommentFactory.Create({
            author: nameAuthor,
          });
        }
      }
    });
    afterEach(async () => {
      sinon.restore();
    });
    describe('On findByCond', async () => {
      it('Should return right count records', async () => {
        const { result } = await CommentModel.findByCond({ author: nameAuthor });
        expect(result.length).to.be.eq(ansverCount);
      });
      it('Should return empty massive comments', async () => {
        const { result } = await CommentModel.findByCond({ author: faker.name.firstName() });
        expect(result).to.be.an('array').that.to.be.empty;
      });
      it('Should check that the error exists', async () => {
        sinon.stub(Mongoose.Model, 'find').throws('DataBase is not responding');
        const result = await CommentModel.findByCond({ author: faker.name.firstName() });
        expect(result.error).to.be.exist;
      });
    });
    describe('On getMany', async () => {
      it('Should return right count records considering limits and skips', async () => {
        const limit = faker.random.number(ansverCount);
        const skip = faker.random.number(limit);
        const ansver = ansverCount - skip >= limit ? limit : ansverCount - skip;
        const { comments } = await CommentModel.getMany({ cond: { author: nameAuthor }, limit, skip });
        expect(comments.length).to.be.eq(ansver);
      });
      it('Should check that the error exists', async () => {
        const result = await CommentModel.getMany({ cond: { author: nameAuthor }, skip: -1 });
        expect(result.error).to.be.exist;
      });
    });
  });
});
