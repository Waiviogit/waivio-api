const {Wobj} = require('../models');
const postsUtil = require('../utilities/steemApi').postsUtil;
const wObjectHelper = require('../utilities/helpers').wObjectHelper;
const followersHelper = require('../utilities/helpers').followersHelper;

const index = async function (req, res, next) {
    const{wObjectsData, error} = await Wobj.getAll({
        userLimit: req.body.userLimit ? req.body.userLimit : 5,
        locale: req.body.locale ? req.body.locale : 'en-US',
        tags: req.body.tags,
        limit: req.body.limit ? req.body.limit: 30 ,          //field for infinite scroll
        startTag: req.body.startTag     //field for infinite scroll
    });
    if(error){
        return next(error);
    }
    res.status(200).json(wObjectsData);
};

const show = async function (req, res, next) {
    data = {
        tag: req.params.wObjectTag,
        limit: req.query.postLimit
    };
    const {wObjectData, error} = await wObjectHelper.combinedWObjectData(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(wObjectData);
};

const posts = async function (req, res, next) {
    const data = {
        tag: req.params.wObjectTag,
        limit: req.body.limit,
        startAuthor: req.body.startAuthor,
        startPermlink: req.body.startPermlink
    };
    const {posts, steemError} = await postsUtil.getPostsByTrending(data);
    if (steemError) {
        return next(steemError);
    }
    res.status(200).json(posts)
};

const followers = async function (req, res, next){
    const data = {
        tag: req.params.wObjectTag,
        startFollower: req.body.startFollower,
        limit: req.body.limit ? req.body.limit : 30
    };
    const {result, error} = await followersHelper.getFollowers(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(result);
};

const create = async function (req, res, next) {
    const {wObject, error} = await Wobj.create({
        tag: req.body.tag,
        weight: req.body.weight,
        fields: req.body.fields,
        parents: req.body.parents
    });
    if (error) {
        return next(error);
    }
    res.status(200).json(wObject._doc);
};

module.exports = {index, create, show, posts, followers};