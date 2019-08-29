const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const AppSchema = new Schema( {
    name: { type: String, index: true, unique: true },
    admin: { type: String, index: true, required: true },
    moderators: [ {
        name: { type: String, required: true },
        author_permlinks: { type: [ String ], default: [] }
    } ],
    supported_object_types: [ {
        object_type: { type: String, index: true },
        required_fields: { type: [ String ], default: [] }

    } ],
    blacklists: {
        wobjects: [],
        posts: [ {
            author: { type: String, required: true },
            permlink: { type: String, required: true }
        } ],
        users: []
    },
    supported_objects: { type: [ String ], index: true, default: [] }
}, { timestamps: true } );

const AppModel = mongoose.model( 'App', AppSchema );

module.exports = AppModel;
