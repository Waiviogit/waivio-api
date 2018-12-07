const {Wobj} = require('../models');
const postsUtil = require('../utilities/steemApi').postsUtil;
const wObjectHelper = require('../utilities/helpers').wObjectHelper;
const followersHelper = require('../utilities/helpers').followersHelper;

const index = async function (req, res, next) {
    const{wObjectsData, error} = await Wobj.getAll({
        user_limit: req.body.user_limit ? req.body.user_limit : 5,
        locale: req.body.locale ? req.body.locale : 'en-US',
        author_permlinks: req.body.author_permlinks,
        limit: req.body.limit ? req.body.limit: 30 ,          //field for infinite scroll
        start_author_permlink: req.body.start_author_permlink     //field for infinite scroll
    });
    if(error){
        return next(error);
    }
    res.status(200).json(wObjectsData);
};

const show = async function (req, res, next) {
    data = {
        author_permlink: req.params.authorPermlink,
        locale: req.query.locale
    };
    const {wObjectData, error} = await wObjectHelper.combinedWObjectData(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(wObjectData);
};

const posts = async function (req, res, next) {
    const data = {
        author_permlink: req.params.authorPermlink,  //for wObject
        limit: req.body.limit,
        start_author: req.body.start_author,          //for posts
        start_permlink: req.body.start_permlink       //for posts
    };
    const {posts, steemError} = await postsUtil.getPostsByTrending(data);
    if (steemError) {
        return next(steemError);
    }
    res.status(200).json(posts)
};

// const followers = async function (req, res, next){
//     const data = {
//         author_permlink: req.params.authorPermlink,
//         start_follower: req.body.start_follower,
//         limit: req.body.limit ? req.body.limit : 30
//     };
//     const {result, error} = await followersHelper.getFollowers(data);
//     if (error) {
//         return next(error);
//     }
//     res.status(200).json(result);
// };

const search = async function (req, res, next){
    const data = {
        string: req.body.search_string,
        limit: req.body.limit ? req.body.limit : 10,
        locale: req.body.locale ? req.body.locale : 'en-US'
    };
    const {wObjectsData, error} = await Wobj.search(data);
    if(error){
        return next(error);
    }
    res.status(200).json(wObjectsData);
};

const fields = async function (req, res, next) {
    const data = {
        author_permlink: req.params.authorPermlink
    };
    const {fieldsData, error} = await Wobj.getFields(data);
    if(error){
        return next(error);
    }
    res.status(200).json(fieldsData);
};

const create = async function (req, res, next) {
    const {wObject, error} = await Wobj.create({
        author_permlink: req.body.author_permlink,
        fields: req.body.fields,
        app: req.body.app,
        community: req.body.community,
        object_type: req.body.object_type
    });
    if (error) {
        return next(error);
    }
    res.status(200).json(wObject);
};

const addField = async function (req, res, next) {
    const {result, error} = await Wobj.addField({
        author_permlink: req.params.authorPermlink,
        name: req.body.field.name,
        body: req.body.field.body,
        locale: req.body.field.locale,
        author: req.body.field.author,
        permlink: req.body.field.permlink
    });
    if (error) {
        return next(error);
    }
    res.status(200).json(result);
};

module.exports = {index, create, addField, show, posts, search, fields};