const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const { COMMENT_REF_TYPES } = require( '../../utilities/constants' );

const CommentRefSchema = new Schema( {
    comment_path: { type: String, required: true },
    type: { type: String, required: true, enum: [ ...Object.values( COMMENT_REF_TYPES ) ] },
    wobjects: { type: String, required: function() {
        return this.type === COMMENT_REF_TYPES.postWithWobjects;
    } },
    name: { type: String, required: function() {
        return this.type === COMMENT_REF_TYPES.wobjType;
    } },
    root_wobj: { type: String, required: function() {
        return this.type === COMMENT_REF_TYPES.appendWobj || this.type === COMMENT_REF_TYPES.createWobj;
    } }
}, { timestamps: false } );

CommentRefSchema.index( { comment_path: 1 }, { unique: true } );

const CommentRefModel = mongoose.model( 'CommentRef', CommentRefSchema );

module.exports = CommentRefModel;
