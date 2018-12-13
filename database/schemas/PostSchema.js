const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    author: {type: String},
    permlink: {type: String},
    parent_author: {type: String, default: ''},
    parent_permlink: {type: String, required: true},
    title: {type: String, required: true, default: ''},
    body: {type: String, required: true, default: ''},
    json_metadata: {type: String, required: true, default: ''},
    app: {type: String},
    depth: {type: Number, default: 0},
    total_vote_weight: {type: Number, default: 0},
    active_votes: [{
        voter: {type: String, required: true},
        author: {type: String, required: true},
        permlink: {type: String, required: true},
        weight: {type: Number, required: true}
    }],
    wobjects: [{
        author_permlink: {type: String, index: true},
        percent: {type: Number}
    }]
}, {timestamps: true});

PostSchema.index({author: 1, permlink: 1},{unique: true});

const PostModel = mongoose.model('Post', PostSchema);

module.exports = PostModel;