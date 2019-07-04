'use strict';
const image = require( '../utilities/images/image' );
const { base64ByUrl } = require( '../utilities/helpers/imagesHelper' );
const uuid = require( 'uuid/v4' );
const WObject = require( '../database' ).models.WObject;
/**
 * Make any changes you need to make to the database here
 */

exports.up = async function up ( done ) {
    const imageFields = await WObject.aggregate( [
        { $unwind: { path: '$fields' } },
        { $match: { 'fields.name': 'avatar' } },
        { $project: { 'field': '$fields', '_id': 1 } }
    ] );

    for( const imageField of imageFields ) {
        const base64 = await base64ByUrl( imageField.field.body );
        const fileName = `${Math.round( new Date() / 1000 )}_${uuid()}`;
        const { imageUrl, error } = await image.uploadInS3( base64, fileName );

        if ( error ) {
            console.log( error );
        } else{
            await image.uploadInS3( base64, fileName, '_small' );
            await image.uploadInS3( base64, fileName, '_medium' );
            await WObject.updateOne( {
                _id: imageFields[ 0 ]._id,
                'fields._id': imageField.field._id
            }, {
                $set: {
                    'fields.$.body': imageUrl
                }
            } );
        }
    }
    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down( done ) {
    done();
};
