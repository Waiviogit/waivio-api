const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const chaiHttp = require('chai-http');
const faker = require('faker');
const { wobjRefsClient } = require('utilities/redis/redis');
const { ObjectID } = require('bson');

chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.use(sinonChai);
const { expect } = chai;
const { Mongoose } = require('database');

faker.random.string = (length = 5) => faker.internet.password(length, false, /[a-z]/);

const {
  Wobj: WobjModel,
  App: AppModel,
  ObjectType: ObjectTypeModel,
  Post: PostModel,
  User: UserModel,
  UserWobjects: UserWobjectsModel,
  Comment: CommentModel,
  Subscriptions: SubscriptionModel,
  websitePayments: WebsitePaymentsModel,
} = require('models');

const dropDatabase = async () => {
  const { models } = require('../database');
  for (const model in models) {
    await models[model].deleteMany();
  }
};

const dropRedisDb = async () => wobjRefsClient.flushdbAsync();

module.exports = {
  app: require('app'),
  ...require('database').models,
  ...require('utilities/redis'),
  ...require('utilities/helpers'),
  ...require('utilities/steemApi'),
  sinon: require('sinon'),
  _: require('lodash'),
  moment: require('moment'),
  SubscriptionModel,
  CommentModel,
  WobjModel,
  PostModel,
  UserModel,
  UserWobjectsModel,
  WebsitePaymentsModel,
  AppModel,
  ObjectTypeModel,
  Mongoose,
  faker,
  chai,
  expect,
  dropDatabase,
  dropRedisDb,
  ObjectID,
};
