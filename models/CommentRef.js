const { CommentRef } = require( '../database' ).models;

exports.create = async ( data ) => {
    const newCommentRef = new CommentRef( data );
    try {
        return { commentRef: await newCommentRef.save() };
    } catch ( error ) {
        return { error };
    }
};

exports.getRef = async ( comment_path ) => {
    try {
        const commentRef = await CommentRef.findOne( { comment_path } ).lean();
        return { commentRef };
    } catch ( error ) {
        return { error };
    }
};
