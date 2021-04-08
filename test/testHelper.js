const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const chaiHttp = require('chai-http');
const { ObjectID } = require('bson');
const faker = require('faker');
const chai = require('chai');

chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.use(sinonChai);
const { expect } = chai;
const { Mongoose } = require('database');

faker.random.string = (length = 5) => faker.internet.password(length, false, /[a-z]/);

const {
  websitePayments: WebsitePaymentsModel,
  Subscriptions: SubscriptionModel,
  UserWobjects: UserWobjectsModel,
  ObjectType: ObjectTypeModel,
  Comment: CommentModel,
  User: UserModel,
  Post: PostModel,
  Wobj: WobjModel,
  App: AppModel,
} = require('models');

const dropDatabase = async () => {
  const { models } = require('../database');
  for (const model in models) {
    await models[model].deleteMany();
  }
};

module.exports = {
  ...require('utilities/helpers'),
  ...require('utilities/hiveApi'),
  ...require('database').models,
  ...require('utilities/redis'),
  moment: require('moment'),
  sinon: require('sinon'),
  _: require('lodash'),
  app: require('app'),
  WebsitePaymentsModel,
  SubscriptionModel,
  UserWobjectsModel,
  ObjectTypeModel,
  dropDatabase,
  CommentModel,
  WobjModel,
  PostModel,
  UserModel,
  AppModel,
  ObjectID,
  Mongoose,
  expect,
  faker,
  chai,
};
