const {
    WobjController,
    UserController
} = require('../controllers');
const express = require('express');

const apiRoutes = express.Router();
const wobjRoutes = express.Router();
const userRoutes = express.Router();

apiRoutes.use('/api', wobjRoutes);
apiRoutes.use('/api', userRoutes);

wobjRoutes.route('/wobject')
    .post(WobjController.index);
wobjRoutes.route('/wobject/:wObjectTag')
    .get(WobjController.show);
wobjRoutes.route('/wobject/:wObjectTag/posts')
    .post(WobjController.posts);
wobjRoutes.route('/wobject/:wObjectTag/followers')
    .post(WobjController.followers);

userRoutes.route('/user')
    .get(UserController.index)
    .post(UserController.create);
userRoutes.route('/user/:userName')
    .get(UserController.show);

module.exports = apiRoutes;