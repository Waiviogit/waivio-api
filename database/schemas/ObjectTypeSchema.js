const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectTypeSchema = new Schema({
        name: {type: String, index: true, required: true},
        author: {type: String, require: true},
        permlink: {type: String, require: true}
    },
    {
        toObject: {virtuals: true}, timestamps: true
    });

ObjectTypeSchema.index({author: 1, permlink: 1}, {unique: true});

const ObjectTypeModel = mongoose.model('ObjectType', ObjectTypeSchema);

module.exports = ObjectTypeModel;