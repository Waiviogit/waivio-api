const PostModel = require('../database').models.Post;
const wObjectHelper = require('../utilities/helpers/wObjectHelper');
const rankHelper = require('../utilities/helpers/rankHelper');
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
        posts = await fillObjects(posts);
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
        posts = await fillObjects(posts);
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
        posts = await fillObjects(posts);
        return {posts}
    } catch (error) {
        return {error}
    }
};

const fillObjects = async (posts, locale = 'en-US') => {
    const fields = REQUIREDFIELDS.map(item => ({name: item}));
    for(const post of posts) {
        for(let wObject of post.wobjects){
            wObject = Object.assign(wObject, post.fullObjects.find(i => i.author_permlink === wObject.author_permlink));
            wObjectHelper.formatRequireFields(wObject, locale, fields);
        }
        await rankHelper.calculateWobjectRank(post.wobjects); //calculate rank for wobject
        delete post['fullObjects'];
    }
    return posts;
};


module.exports = {getByObject, getFeedByObjects, getAllPosts};