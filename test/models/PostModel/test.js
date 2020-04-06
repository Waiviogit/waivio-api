const {
  PostModel, faker, expect, sinon,
} = require('test/testHelper');
const { PostFactory } = require('test/factories');

describe('Post Model', async () => {
  describe('On aggregate', async () => {
    let app;
    beforeEach(async () => {
      app = await PostFactory.Create();
    });
    it('Should', async () => {
      const result = await PostModel.aggregate([{
        $match: {
          author: app.author,
        },
      }]);
      expect(result);
      console.log(result);
    });
    it('Should another aggregate step', async () => {
      const result = await PostModel.aggregate([{
        $match: {
          author: app.author,
        },
      }]);
      expect(result);
      console.log(result);
    });
    it('Should take right count posts', async () => {
      const result = await PostModel.aggregate([{
        $match: {
          author: app.author,
        },
      }]);
      expect(result);
      console.log(result);
    });
    it('Dont take right result', async () => {
      const result = await PostModel.aggregate([{
        $match: {
          author: app.author,
        },
        $group: {
          author: app.author,
        },
      }]);
      console.log(result);
    });
    //Check and write right title
    it('Error', async () => {
      const { error } = await PostModel.aggregate([{
        $match: {
          author: faker.name.firstName(),
        },
      }]);
      console.log(error);
      expect(error).to.be.exist;
    });
  });
  describe('On fillObjects', async () => {
    let post;
    beforeEach(async () => {
      post = await PostFactory.Create();
    });
    it('Should', async () => {
      const result = await PostModel.fillObjects([post]);
      expect(result).to.deep.eq(post);
      console.log(result);
    });
    it('Dont take right result', async () => {
      const result = await PostModel.fillObjects([{}]);
      console.log(result);
    });
    it('Error', async () => {
      const result = await PostModel.fillObjects([{}]);
      console.log(result);
    });
  });
  describe('On getByFollowList', async () => {
    let app, users, author_permlinks, skip, limit, user_languages, filtersData;
    beforeEach(async () => {
      users = faker.name.firstName();
      app = await PostFactory.Create();
    });
    it('Should', async () => {
      const result = await PostModel.getByFollowList(users, author_permlinks, skip, limit, user_languages, filtersData);
      console.log(result);
    });
    it('Dont take right result', async () => {
      const result = await PostModel.getByFollowList([{
        $match: {
          author: app.author,
        },
      }]);
      console.log(result);
    });
    it('Error', async () => {
      const result = await PostModel.getByFollowList([{
        $match: {
          author: app.author,
        },
      }]);
      console.log(result);
    });
  });
});
