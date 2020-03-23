const { dropDatabase, Mongoose } = require('./testHelper');

before(async () => {
  process.env.NODE_ENV = 'test';
  await Mongoose.connection.dropDatabase();
});

beforeEach(async () => {
  process.env.NODE_ENV = 'test';
  await dropDatabase();
});
