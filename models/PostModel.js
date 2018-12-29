const PostModel = require('../database').models.Post;
const mongoose = require('mongoose');


const getByObject = async function (data) {
    try {
        const posts = await PostModel
            .find()
            .where('wobjects.author_permlink').equals(data.author_permlink)
            .sort({_id: -1})
            .where('_id').lt(data.start_id ? data.start_id : new mongoose.mongo.ObjectId())
            .limit(data.limit)
            .lean();

        return {posts}
    } catch (error) {
        return {error}
    }
};

const getFeedByObjects = async function (data) {        //data include objects(array of strings), limit, skip
    try {
        const posts = await PostModel
            .find({'wobjects.author_permlink': {$in: data.objects}})
            .sort({_id: -1})
            .skip(data.skip)
            .limit(data.limit)
            .lean();
        return {posts}
    } catch (error) {
        return {error}
    }
};


module.exports = {getByObject, getFeedByObjects};