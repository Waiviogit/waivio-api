const { CronJob } = require( 'cron' );
const { User, WObject } = require( '../../database' ).models;

const refreshUsersCounts = async () => {
    try {
        await User.update( {}, { $set: { last_posts_count: 0 } } );
    } catch ( error ) {
        console.log( error );
    }
};

const refreshWobjectsCounts = async () => {
    try {
        await WObject.updateMany( {}, { $set: { last_posts_count: 0 } } );
    } catch ( error ) {
        console.log( error );
    }
};

const job = new CronJob( '0 0 0 * * *', async () => {
    console.log( 'start' );
    // refresh last_posts_count for each user and wobject every day at 00:00
    await refreshUsersCounts();
    await refreshWobjectsCounts();
    console.log( 'done' );
}, null, true, null, null, false );

job.start();
