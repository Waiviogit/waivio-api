const { Comment } = require( '../database' ).models;

const getOne = async ( { author, permlink, userId } ) => {
    try {
        const cond = author ? { author, permlink } : { userId, permlink };
        return { comment: await Comment.findOne( { ...cond } ).lean() };
    } catch ( error ) {
        return { error };
    }
};

const findByCond = async ( cond ) => {
    try {
        return{ result: await Comment.find( { ...cond } ).lean() };
    } catch ( error ) {
        return { error };
    }
};

module.exports = { getOne, findByCond };
