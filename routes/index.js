const { Router } = require('express');

const routes = [
  { route: require('./wobject') },
  { route: require('./user') },
  { route: require('./post') },
  { route: require('./app') },
  { route: require('./objectType') },
  { route: require('./site') },
  { route: require('./vipTicket') },
  { route: require('./department') },
  { route: require('./hive') },
  { route: require('./shop') },
  { route: require('./draft') },
  { route: require('./thread') },
];

const apiRoutes = new Router();

routes.forEach(({ route }) => { apiRoutes.use('/api', route); });

module.exports = apiRoutes;
