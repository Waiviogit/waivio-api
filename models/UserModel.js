const UserModel = require( '../database' ).models.User;
const wObjectHelper = require( '../utilities/helpers/wObjectHelper' );
const rankHelper = require( '../utilities/helpers/rankHelper' );
const { REQUIREDFIELDS } = require( '../utilities/constants' );

const getOne = async function ( name ) {
    try {
        return { user: await UserModel.findOne( { name: name } ).lean() };
    } catch ( error ) {
        return { error };
    }
};

const getAll = async function ( { limit, skip } ) {
    try {
        return { UserData: await UserModel.find().skip( skip ).limit( limit ).lean() };
    } catch ( error ) {
        return { error };
    }
};

const getObjectsFollow = async function ( data ) { // list of wobjects which specified user is follow
    try {
        const user = await UserModel.findOne( { name: data.name } )
            .populate( {
                path: 'full_objects_follow',
                options: {
                    limit: data.limit,
                    skip: data.skip,
                    sort: { weight: -1 },
                    select: '-_id '
                }
            } ) // fill array author_permlink-s full info about wobject
            .select( 'objects_follow' )
            .lean();

        if ( !user || !user.full_objects_follow ) {
            return { wobjects: [] };
        }
        const fields = REQUIREDFIELDS.map( ( item ) => ( { name: item } ) );

        user.full_objects_follow.forEach( ( wObject ) => {
            wObjectHelper.formatRequireFields( wObject, data.locale, fields );
        } );

        await rankHelper.calculateWobjectRank( user.full_objects_follow ); // calculate rank for wobject

        return { wobjects: user.full_objects_follow };
    } catch ( error ) {
        return { error };
    }
};

const aggregate = async ( pipeline ) => {
    try {
        const result = await UserModel.aggregate( pipeline ).exec();

        if( !result ) {
            return { error: { status: 404, message: 'Not found!' } };
        }
        return { result };
    } catch ( error ) {
        return { error };
    }
};

const updateOne = async ( condition, updateData = {} ) => {
    try {
        const user = await UserModel
            .findOneAndUpdate( condition, updateData, { upsert: true, new: true, setDefaultsOnInsert: true } )
            .select( '+user_metadata' );

        return { user };
    } catch ( error ) {
        return { error };
    }
};

module.exports = { getAll, getOne, getObjectsFollow, aggregate, updateOne };
