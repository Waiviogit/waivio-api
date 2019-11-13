const { CommentRef } = require( '../database' ).models;

exports.getRef = async ( comment_path ) => {
    try {
        const commentRef = await CommentRef.findOne( { comment_path } ).lean();
        return { commentRef };
    } catch ( error ) {
        return { error };
    }
};

exports.create = create;
