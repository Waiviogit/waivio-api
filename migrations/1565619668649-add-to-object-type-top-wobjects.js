'use strict';
const { ObjectType } = require( '../database' ).models;
const updateObjectTypes = require( '../utilities/operations/objectType/updateTopWobjects' );
/**
 * Make any changes you need to make to the database here
 */

exports.up = async function up ( done ) {
    await updateObjectTypes( true );
    done();
};
/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down( done ) {
    await ObjectType.update( {}, { $unset: { top_wobjects: '' } } );
    console.log( 'Deleted field "top_wobjects" from all of ObjectTypes!' );
    done();
};
