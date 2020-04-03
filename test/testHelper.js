const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const faker = require('faker');

chai.use(chaiAsPromised);
chai.use(sinonChai);
const { expect } = chai;
const { Mongoose } = require('database');

faker.random.string = (length = 5) => faker.internet.password(length, false, /[a-z]/);

const {
  Wobj: WobjModel, App: AppModel, ObjectType: ObjectTypeModel, Post: PostModel, User: UserModel, Comment: CommentModel,
} = require('models');

const dropDatabase = async () => {
  const { models } = require('../database');
  for (const model in models) {
    await models[model].deleteMany();
  }
};

module.exports = {
  ...require('database').models,
  sinon: require('sinon'),
  CommentModel,
  WobjModel,
  PostModel,
  UserModel,
  AppModel,
  ObjectTypeModel,
  Mongoose,
  faker,
  chai,
  expect,
  dropDatabase,
};
