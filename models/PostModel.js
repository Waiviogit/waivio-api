const PostModel = require('../database').models.Post;
const wObjectHelper = require('../utilities/helpers/wObjectHelper');
const mongoose = require('mongoose');
const {REQUIREDFIELDS} = require('../utilities/constants');


const getByObject = async function (data) {     //data include author_permlink, limit, start_id, locale
    try {
        let posts = await PostModel.aggregate([
            {$match: {'wobjects.author_permlink': data.author_permlink}},
            {$sort: {_id: -1}},
            {$match: {_id: {$lt: data.start_id ? new mongoose.mongo.ObjectId(data.start_id) : new mongoose.mongo.ObjectId()}}},
            {$limit: data.limit},
            {$lookup: {
                    from: 'wobjects',
                    localField: 'wobjects.author_permlink',
                    foreignField: 'author_permlink',
                    as: 'fullObjects'}}
        ]);
        posts = fillObjects(posts);
        return {posts}
    } catch (error) {
        return {error}
    }
};      //return posts feed by one specified wobject

const getFeedByObjects = async function (data) {        //data include objects(array of strings), limit, skip, locale, user
    try {
        let posts = await PostModel.aggregate([
            {$match: {$or: [
                        {'wobjects.author_permlink': {$in: data.objects}},
                        {author: data.user}]}},
            {$sort: {_id: -1}},
            {$skip:data.skip},
            {$limit: data.limit},
            {$lookup: {
                    from: 'wobjects',
                    localField: 'wobjects.author_permlink',
                    foreignField: 'author_permlink',
                    as: 'fullObjects'}}
        ]);
        posts = fillObjects(posts);
        return {posts}
    } catch (error) {
        return {error}
    }
};      //return posts of list wobjects and one specified author(use on user feed)

const getAllPosts = async function (data) {
    try {
        let posts = await PostModel.aggregate([
            {$sort: {_id: -1}},
            {$match: {_id: {$lt: data.start_id ? new mongoose.mongo.ObjectId(data.start_id) : new mongoose.mongo.ObjectId()}}},
            {$limit: data.limit},
            {$lookup: {
                    from: 'wobjects',
                    localField: 'wobjects.author_permlink',
                    foreignField: 'author_permlink',
                    as: 'fullObjects'}}
        ]);
        posts = fillObjects(posts);
        return {posts}
    } catch (error) {
        return {error}
    }
};

const fillObjects = (posts, locale = 'en-US') => {
    const fields = REQUIREDFIELDS.map(item => ({name: item}));
    posts.forEach((post) => {
        post.wobjects.forEach((wObject)  => {
            wObject = Object.assign(wObject, post.fullObjects.find(i => i.author_permlink === wObject.author_permlink));
            wObjectHelper.formatRequireFields(wObject, locale, fields);
        });
        delete post['fullObjects'];
    });
    return posts;
};


module.exports = {getByObject, getFeedByObjects, getAllPosts};