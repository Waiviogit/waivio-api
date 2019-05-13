const { ObjectType } = require( '../database' ).models;
const { REQUIREDFIELDS, REQUIREFIELDS_PARENT } = require( '../utilities/constants' );
const { postsUtil } = require( '../utilities/steemApi' );
const _ = require( 'lodash' );

const getAll = async ( { limit, skip, wobjects_count = 3 } ) => {
    let objectTypes;

    try {
        objectTypes = await ObjectType.aggregate( [
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'wobjects',
                    as: 'related_wobjects',
                    let: { object_type_name: '$name' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: [ '$object_type', '$$object_type_name' ] }
                            }
                        },
                        { $sort: { weight: -1 } },
                        { $limit: wobjects_count + 1 },
                        {
                            $addFields: {
                                'fields': {
                                    $filter: {
                                        input: '$fields',
                                        as: 'field',
                                        cond: {
                                            $in: [ '$$field.name', REQUIREDFIELDS ]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ] );
    } catch ( e ) {
        return { error: e };
    }
    for( const type of objectTypes ) {
        if( type.related_wobjects.length === wobjects_count + 1 ) {
            type.hasMoreWobjects = true;
            type.related_wobjects = type.related_wobjects.slice( 0, wobjects_count );
        }
    }

    return { objectTypes };
};

const search = async ( { string, limit = 20, skip = 0 } ) => {
    try {
        if ( !string ) {
            throw { status: 422, message: 'Search string is empty' };
        }
        const objectTypes = await ObjectType.aggregate( [
            { $match: { name: { $regex: `${string}`, $options: 'i' } } },
            { $skip: skip },
            { $limit: limit }
        ] );

        return { objectTypes };
    } catch ( e ) {
        return { error: e };
    }
};

const getOne = async ( { name, wobjects_count = 3 } ) => {
    try {
        // const objectType = await ObjectType.findOne({name: name}).lean();
        const [ objectType ] = await ObjectType.aggregate( [
            { $match: { name } },
            {
                $lookup: {
                    from: 'wobjects',
                    as: 'related_wobjects',
                    let: { object_type_name: '$name' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: [ '$object_type', '$$object_type_name' ] }
                            }
                        },
                        { $sort: { weight: -1 } },
                        { $limit: wobjects_count + 1 },
                        {
                            $addFields: {
                                'fields': {
                                    $filter: {
                                        input: '$fields',
                                        as: 'field',
                                        cond: {
                                            $in: [ '$$field.name', REQUIREDFIELDS ]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'wobjects',
                                localField: 'parent',
                                foreignField: 'author_permlink',
                                as: 'parent'
                            }
                        }
                    ]
                }
            }
        ] );

        if ( !objectType ) {
            throw { status: 404, message: 'Object Type not found!' };
        }
        if( objectType.related_wobjects.length === wobjects_count + 1 ) {
            objectType.hasMoreWobjects = true;
            objectType.related_wobjects = objectType.related_wobjects.slice( 0, wobjects_count );
        }
        console.log();
        objectType.related_wobjects.forEach( ( wobject ) => {
            // format wobjects parent field
            if( Array.isArray( wobject.parent ) ) {
                if( _.isEmpty( wobject.parent ) ) {
                    wobject.parent = '';
                } else {
                    wobject.parent = wobject.parent[ 0 ];
                    wobject.parent.fields = wobject.parent.fields.filter( ( item ) => REQUIREFIELDS_PARENT.includes( item.name ) );
                }
            }
        } );

        const { post } = await postsUtil.getPost( objectType.author, objectType.permlink );

        if( post && post.body ) {
            objectType.body = post.body;
        }
        return { objectType };
    } catch ( e ) {
        return { error: e };
    }
};

module.exports = { getAll, search, getOne };
