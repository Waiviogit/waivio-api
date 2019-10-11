const { CronJob } = require( 'cron' );
const { User, WObject } = require( '../../database' ).models;
const _ = require( 'lodash' );

const refreshUsersCounts = async () => {
    // const users = await User.find( {}, { _id: 1, last_posts_count: 1, last_posts_counts_by_hours: 1 } ).lean();
    // update users which has no any posts by last 24 hours
    await User.updateMany(
        { last_posts_count: 0 },
        {
            $push: {
                last_posts_counts_by_hours: {
                    $each: [ 0 ],
                    $position: 0,
                    $slice: 24
                }
            }
        }
    );
    // update wobjects which has posts by last 24 hours
    let cursor = User.find( { last_posts_count: { $ne: 0 } } ).cursor( { batchSize: 1000 } );
    let success_count = 0;
    await cursor.eachAsync( async ( doc ) => {
        let user = doc.toObject();

        const last_hour_posts = findLastHourCount( user.last_posts_counts_by_hours, user.last_posts_count );
        user.last_posts_count = decreasedSummaryCount( user.last_posts_counts_by_hours, user.last_posts_count );
        user.last_posts_counts_by_hours = pushLastCountToArray( user.last_posts_counts_by_hours, last_hour_posts );
        const res = await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    last_posts_count: user.last_posts_count,
                    last_posts_counts_by_hours: user.last_posts_counts_by_hours
                }
            }
        );
        if ( res.nModified ) success_count++;
    } );
    console.log( 'Users posts count updates: ' + success_count );
};

const refreshWobjectsCounts = async () => {
    // update wobjects which has no any posts by last 24 hours
    await WObject.updateMany(
        { last_posts_count: 0 },
        {
            $push: {
                last_posts_counts_by_hours: {
                    $each: [ 0 ],
                    $position: 0,
                    $slice: 24
                }
            }
        }
    );
    // update wobjects which has posts by last 24 hours
    let cursor = WObject.find( { last_posts_count: { $ne: 0 } } ).cursor( { batchSize: 1000 } );
    let success_count = 0;
    await cursor.eachAsync( async ( doc ) => {
        let wobject = doc.toObject();
        const last_hour_posts = findLastHourCount( wobject.last_posts_counts_by_hours, wobject.last_posts_count );
        wobject.last_posts_count = decreasedSummaryCount( wobject.last_posts_counts_by_hours, wobject.last_posts_count );
        wobject.last_posts_counts_by_hours = pushLastCountToArray( wobject.last_posts_counts_by_hours, last_hour_posts );
        const res = await WObject.updateOne(
            { _id: wobject._id },
            { $set: { last_posts_count: wobject.last_posts_count, last_posts_counts_by_hours: wobject.last_posts_counts_by_hours } }
        );
        if( res.nModified ) success_count++;
    } );
    console.log( 'Wobjects posts count updates: ' + success_count );
};

/**
 * Push last count value to begin of array and delete last item if length greater than 24
 * @param arr_counts {[Number]}
 * @param last_hour_count {Number}
 * @returns {[Number]}
 */
const pushLastCountToArray = ( arr_counts, last_hour_count ) => {
    let new_arr = [ ...arr_counts ];
    new_arr.unshift( last_hour_count );
    return new_arr.slice( 0, 24 );
};

/**
 * Find new value for summary count of posts by decreasing on value of last item in value
 * @param arr_counts {[Number]} Array of counts posts by last 24 hours;
 * @param summary_count {Number} Count of post by last 24+ hours. Always greater of equal than sum in array of counts
 * @returns {Number} New value for summary_count
 */
const decreasedSummaryCount = ( arr_counts, summary_count ) => {
    return arr_counts.length < 24 ? summary_count : summary_count - _.last( arr_counts );
};

/**
 * Get count of post by last hour.
 * @param arr_counts {[Number]} Array of counts posts by last 24 hours;
 * @param summary_count {Number} Count of post by last 24+ hours. Always greater of equal than sum in array of counts
 * @returns {Number} Count of post by last hour
 */
const findLastHourCount = ( arr_counts, summary_count ) => {
    return summary_count - _.sum( arr_counts );
};

const job = new CronJob( '0 * * * *', async () => {
    console.log( 'Start updating last posts counts!' );
    await refreshUsersCounts();
    await refreshWobjectsCounts();
}, null, true, null, null, false );

job.start();
