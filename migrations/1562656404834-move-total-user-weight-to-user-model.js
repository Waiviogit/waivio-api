'use strict';
const { User, UserWobjects } = require( '../database' ).models;

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up ( done ) {
    let users;

    try {
        users = await UserWobjects.aggregate( [
            { $group: { _id: '$user_name', weight: { $sum: '$weight' } } },
            { $project: { _id: 0, name: '$_id', weight: 1 } }
        ] );
    } catch ( error ) {
        return { error };
    }
    for( const user of users ) {
        await User.update( { name: user.name }, { $set: { wobjects_weight: user.weight } } );
        console.log( `Wobjects weight ${user.weight} for user ${user.name} updated!` );
    }

    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down( done ) {
    await User.update( {}, { $unset: { wobjects_weight: '' } }, { multi: true } );
    done();
};
