const { CronJob } = require( 'cron' );
const { WObject, ObjectType } = require( '../../../database' ).models;
const { OBJECT_TYPE_TOP_WOBJECTS_COUNT } = require( '../../constants' );

const updateObjectTypes = async ( isLog = false ) => {
    let cursor = ObjectType.find().cursor( { batchSize: 1000 } );

    await cursor.eachAsync( async ( doc ) => {
        const wobjs_array = await WObject
            .find( { 'object_type': doc.name } )
            .sort( { weight: -1 } )
            .limit( OBJECT_TYPE_TOP_WOBJECTS_COUNT );
        const author_permlinks = wobjs_array.map( ( p ) => p.author_permlink );
        const res = await ObjectType.updateOne( { _id: doc._id }, { $set: { top_wobjects: author_permlinks } } );

        if( res.nModified && isLog ) {
            console.log( `Object Type ${doc.name} updated! Add ${author_permlinks.length} wobjects refs!` );
        }
    } );
};

const job = new CronJob( '0 */30  * * * *', async () => {
    // update TOP wobjects for each ObjectType every 30 minutes
    await updateObjectTypes();
    console.log( 'Updating top wobjects by ObjectType finished!' );
}, null, true, null, null, true );

job.start();
module.exports = updateObjectTypes;
