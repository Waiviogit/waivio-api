const {Wobj} = require('../models');
const postsUtil = require('../utilities/steemApi').postsUtil;
const wObjectHelper = require('../utilities/helpers').wObjectHelper;
const followersHelper = require('../utilities/helpers').followersHelper;

const index = async function (req, res, next) {
    const{wObjectsData, error} = await Wobj.getAll({
        userLimit: req.body.userLimit ? req.body.userLimit : 5,
        locale: req.body.locale ? req.body.locale : 'en-US',
        authorPermlinks: req.body.authorPermlinks,
        limit: req.body.limit ? req.body.limit: 30 ,          //field for infinite scroll
        startAuthorPermlink: req.body.startAuthorPermlink     //field for infinite scroll
    });
    if(error){
        return next(error);
    }
    res.status(200).json(wObjectsData);
};

const show = async function (req, res, next) {
    data = {
        authorPermlink: req.params.authorPermlink,
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
        authorPermlink: req.params.authorPermlink,  //for wObject
        limit: req.body.limit,
        startAuthor: req.body.startAuthor,          //for posts
        startPermlink: req.body.startPermlink       //for posts
    };
    const {posts, steemError} = await postsUtil.getPostsByTrending(data);
    if (steemError) {
        return next(steemError);
    }
    res.status(200).json(posts)
};

const followers = async function (req, res, next){
    const data = {
        authorPermlink: req.params.authorPermlink,
        startFollower: req.body.startFollower,
        limit: req.body.limit ? req.body.limit : 30
    };
    const {result, error} = await followersHelper.getFollowers(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(result);
};

const search = async function (req, res, next){
    const data = {
        string: req.body.searchString,
        limit: req.body.limit ? req.body.limit : 10,
        locale: req.body.locale ? req.body.locale : 'en-US'
    };
    const {wObjectsData, error} = await Wobj.search(data);
    if(error){
        return next(error);
    }
    res.status(200).json(wObjectsData);
}

const create = async function (req, res, next) {
    const {wObject, error} = await Wobj.create({
        authorPermlink: req.body.authorPermlink,
        weight: req.body.weight,
        fields: req.body.fields,
        parents: req.body.parents
    });
    if (error) {
        return next(error);
    }
    res.status(200).json(wObject._doc);
};

module.exports = {index, create, show, posts, followers, search};