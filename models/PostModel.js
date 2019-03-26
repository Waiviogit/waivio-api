const PostModel = require('../database').models.Post;
const wObjectHelper = require('../utilities/helpers/wObjectHelper');
const rankHelper = require('../utilities/helpers/rankHelper');
const mongoose = require('mongoose');
const {REQUIREDFIELDS} = require('../utilities/constants');
const AppModel = require('./AppModel');


const getByObject = async function (data) {     //data include author_permlink, limit, start_id, locale
    try {
        let posts = await PostModel.aggregate([
            {$match: {'wobjects.author_permlink': data.author_permlink}},
            {$sort: {_id: -1}},
            {$match: {_id: {$lt: data.start_id ? new mongoose.mongo.ObjectId(data.start_id) : new mongoose.mongo.ObjectId()}}},
            {$limit: data.limit},
            {
                $lookup: {
                    from: 'wobjects',
                    localField: 'wobjects.author_permlink',
                    foreignField: 'author_permlink',
                    as: 'fullObjects'
                }
            }
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
            {
                $match: {
                    $or: [
                        {'wobjects.author_permlink': {$in: data.objects}},
                        {author: data.user}]
                }
            },
            {$sort: {_id: -1}},
            {$skip: data.skip},
            {$limit: data.limit},
            {
                $lookup: {
                    from: 'wobjects',
                    localField: 'wobjects.author_permlink',
                    foreignField: 'author_permlink',
                    as: 'fullObjects'
                }
            }
        ]);
        posts = await fillObjects(posts);
        return {posts}
    } catch (error) {
        return {error}
    }
};      //return posts of list wobjects and one specified author(use on user feed)

const getAllPosts = async function (data) {
    try {
        const aggregatePipeline = [
            {$sort: {_id: -1}},
            {$skip: data.skip},
            {$limit: data.limit},
            {
                $lookup: {
                    from: 'wobjects',
                    localField: 'wobjects.author_permlink',
                    foreignField: 'author_permlink',
                    as: 'fullObjects'
                }
            }
        ];
        if (data.filter) {
            if (data.filter.byApp) {
                const {app} = await AppModel.getOne({name: data.filter.byApp});
                if (app && app.supported_objects.length) {
                    aggregatePipeline.unshift({
                        $match: {
                            'wobjects.author_permlink': {$in: app.supported_objects}
                        }
                    })
                }
            }
        }
        let posts = await PostModel.aggregate(aggregatePipeline);
        posts = await fillObjects(posts);
        return {posts}
    } catch (error) {
        return {error}
    }
};

const fillObjects = async (posts, locale = 'en-US') => {
    const fields = REQUIREDFIELDS.map(item => ({name: item}));
    for (const post of posts) {
        for (let wObject of post.wobjects) {
            wObject = Object.assign(wObject, post.fullObjects.find(i => i.author_permlink === wObject.author_permlink));
            wObjectHelper.formatRequireFields(wObject, locale, fields);
        }
        await rankHelper.calculateWobjectRank(post.wobjects); //calculate rank for wobject
        delete post['fullObjects'];
    }
    return posts;
};

const getByUserAndApp = async (appWobjects, usersFollows, wobjectsFollows, limit, skip) => {
    try {
        let posts = await PostModel.aggregate([
            {
                $match: {
                    $and: [
                        {'wobjects.author_permlink': {$in: appWobjects}},
                        {
                            $or: [
                                {'wobjects.author_permlink': {$in: wobjectsFollows}},
                                {author: {$in: usersFollows}}
                            ]
                        }
                    ]
                }
            },
            {$sort:{_id:-1}},
            {$skip: skip},
            {$limit: limit},
            {
                $lookup: {
                    from: 'wobjects',
                    localField: 'wobjects.author_permlink',
                    foreignField: 'author_permlink',
                    as: 'fullObjects'
                }
            }
        ]);
        posts = await fillObjects(posts);
        return {posts}
    } catch (error) {
        return {error}
    }
};


module.exports = {getByObject, getFeedByObjects, getAllPosts, getByUserAndApp};