const {Wobj} = require('../models');
const {Post} = require('../models');
const followersHelper = require('../utilities/helpers').followersHelper;

const index = async function (req, res, next) {
    const {wObjectsData, error} = await Wobj.getAll({
        user_limit: req.body.user_limit || 5,
        locale: req.body.locale || 'en-US',
        author_permlinks: req.body.author_permlinks,
        object_types: req.body.object_types,
        required_fields: req.body.required_fields,
        limit: req.body.limit || 30,          //field for infinite scroll
        skip: req.body.skip || 0
    });
    if (error) {
        return next(error);
    }
    res.status(200).json(wObjectsData);
};

const show = async function (req, res, next) {
    data = {
        author_permlink: req.params.authorPermlink,
        locale: req.query.locale,
        required_fields: req.query.required_fields,
    };
    // const {wObjectData, error} = await wObjectHelper.combinedWObjectData(data);
    const {wObjectData, error} = await Wobj.getOne(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(wObjectData);
};

const posts = async function (req, res, next) {
    const data = {
        author_permlink: req.params.authorPermlink,             //for wObject
        limit: req.body.limit ? req.body.limit : 30,            //
        start_id: req.body.start_id                             //for infinite scroll
    };
    const {posts, error} = await Post.getByObject(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(posts)
};

const feed = async function (req, res, next) {
    const data = {
        limit: req.body.limit ? req.body.limit : 30,            //
        start_id: req.body.start_id                             //for infinite scroll
    };
    const {posts, error} = await Post.getAllPosts(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(posts);
};

const followers = async function (req, res, next) {
    const data = {
        author_permlink: req.params.authorPermlink,
        skip: req.body.skip ? req.body.skip : 0,
        limit: req.body.limit ? req.body.limit : 30
    };
    const {followers, error} = await followersHelper.getFollowers(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(followers);
};

const search = async function (req, res, next) {
    const data = {
        string: req.body.search_string,
        limit: req.body.limit ? req.body.limit : 10,
        locale: req.body.locale ? req.body.locale : 'en-US'
    };
    const {wObjectsData, error} = await Wobj.search(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(wObjectsData);
};

const fields = async function (req, res, next) {
    const data = {
        author_permlink: req.params.authorPermlink
    };
    const {fieldsData, error} = await Wobj.getFields(data);
    if (error) {
        return next(error);
    }
    res.status(200).json(fieldsData);
};

// const create = async function (req, res, next) {
//     const {wObject, error} = await Wobj.create({
//         author_permlink: req.body.author_permlink,
//         fields: req.body.fields,
//         app: req.body.app,
//         community: req.body.community,
//         object_type: req.body.object_type
//     });
//     if (error) {
//         return next(error);
//     }
//     res.status(200).json(wObject);
// };
//
// const addField = async function (req, res, next) {
//     const {result, error} = await Wobj.addField({
//         author_permlink: req.params.authorPermlink,
//         name: req.body.field.name,
//         body: req.body.field.body,
//         locale: req.body.field.locale,
//         author: req.body.field.author,
//         permlink: req.body.field.permlink
//     });
//     if (error) {
//         return next(error);
//     }
//     res.status(200).json(result);
// };

const gallery = async function (req, res, next) {
    const {gallery, error} = await Wobj.getGalleryItems({
        author_permlink: req.params.authorPermlink
    });
    if (error) {
        return next(error)
    }
    res.status(200).json(gallery);
};

const catalog = async function (req, res, next){
    const {catalog, error} = await Wobj.getCatalog(req.params.authorPermlink);
    if(error)
        return next(error);
    res.status(200).json(catalog);
};

module.exports = {index, create, addField, show, posts, search, fields, followers, gallery, feed, catalog};