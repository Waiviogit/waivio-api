const { expect, AppModel } = require('test/testHelper');
const { AppFactory } = require('test/factories');

describe('App Model', async () => {
  describe('On getOne', async () => {
    let app,
      result;
    beforeEach(async () => {
      app = await AppFactory.Create();
    });
    it('Should check names for identity', async () => {
      result = await AppModel.getOne({ name: app.name });
      expect(result.app).to.deep.eq(app);
    });
  });
});
