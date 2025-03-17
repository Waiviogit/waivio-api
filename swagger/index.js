const config = require('../config');
const user = require('./user');
const wobject = require('./wobject');
const post = require('./post');
const objectType = require('./objectType');
const generalSearch = require('./generalSearch');
const image = require('./image');
const app = require('./app');
const sites = require('./sites');
const vipTickets = require('./vipTickets');
const hive = require('./hive');
const hiveEngine = require('./hiveEngine');
const departments = require('./departments');
const shop = require('./shop');
const draft = require('./draft');
const thread = require('./thread');
const admins = require('./admins');

const tags = require('./tags');
const definitions = require('./definitions');

module.exports = {
  swagger: '2.0',
  info: {
    description: 'API for all waivio apps\n[UI template for Waivio](https://waivio.com)\n',
    version: '1.0.0',
    title: 'Waivio API',
    termsOfService: 'https://hive.blog/@waivio',
    contact: {
      email: 'maxim@wizardsdev.com',
    },
  },
  host: config.swaggerHost,
  tags,
  schemes: [
    'https',
    'http',
  ],
  paths: {
    ...user,
    ...wobject,
    ...post,
    ...objectType,
    ...generalSearch,
    ...image,
    ...app,
    ...sites,
    ...vipTickets,
    ...hive,
    ...hiveEngine,
    ...departments,
    ...shop,
    ...draft,
    ...thread,
    ...admins,
  },
  definitions,
};
