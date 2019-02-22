const {User} = require('../models');
const {wObjectHelper, userFeedHelper} = require('../utilities/helpers');
const {postsUtil} = require('../utilities/steemApi');

const index = async function (req, res, next) {
    const {UserData, error} = await User.getAll();
    if (error) {
        res.json({error});
        return next(error);
    }
    res.status(200).json(UserData);
};

const show = async function (req, res, next) {
    const {userData, error} = await User.getOne(req.params.userName);
    if (error) {
        return next(error);
    }
    res.status(200).json(userData);
};

const create = async function (req, res, next) {
    const {user, error} = await User.create({
        name: req.body.name,
        profile_image: req.body.profile_image,
        w_objects: req.body.w_objects,
        read_locales: req.body.read_locales,
        objects_follow: req.body.objects_follow
    });
    if (error) {
        return next(error);
    }
    res.status(200).json(user._doc);
};

const objects_follow = async function (req, res, next) {
    const data = {
        name: req.params.userName,
        locale: req.body.locale ? req.body.locale : 'en-US',
        limit: req.body.limit ? req.body.limit : 50,
        skip: req.body.skip ? req.body.skip : 0
    };
    const {wobjects, error} = await User.getObjectsFollow(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(wobjects);
};

const objects_feed = async function (req, res, next) {
    const {posts, error} = await wObjectHelper.userFeedByObjects({
        user: req.params.userName,
        skip: req.body.skip ? req.body.skip : 0,
        limit: req.body.limit ? req.body.limit : 30
    });
    if (error) {
        return next(error);
    }
    res.status(200).json(posts);
};

const feed = async function (req, res, next) {
    const {result, error} = await userFeedHelper.getCombinedFeed({
        user: req.params.userName,
        limit: req.body.limit || 20,
        count_with_wobj: req.body.count_with_wobj || 0,
        last_author: req.body.last_author || '',
        last_permlink: req.body.last_permlink || ''
    });
    if (error)
        return next(error);
    res.status(200).json(result);
};

const userObjectsShares = async function(req, res, next){
    const {wobjects, error} = await User.getUserObjectsShares({
        name: req.params.userName,
        limit: req.body.limit || 30,
        skip: req.body.skip || 0,
        locale: req.body.locale || 'en-US'
    });
    if(error){
        return next(error);
    }
    res.status(200).json(wobjects);
};

module.exports = {index, create, show, objects_follow, objects_feed, feed, userObjectsShares};