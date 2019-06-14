const App = require( '../../models/AppModel' );
const { getUsers } = require( '../operations/user/getTopUsers' );
const CronJob = require( 'cron' ).CronJob;

const job = new CronJob( '0 0 */12 * * *', async () => {
    console.log( 'Cron Job started!' );
    const { users, error } = await getUsers();

    if ( error ) {
        console.error( error );
        return;
    }
    const { result, error: onSetError } = await App.setTopUsers( { users } );

    if ( onSetError ) {
        console.error( onSetError );
    } else if ( result ) {
        console.log( 'TOP USERS SUCCESSFULLY UPDATED BY CRON JOB!' );
    }
}, null, false, null, null, true );

job.start();

