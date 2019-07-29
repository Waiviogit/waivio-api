const { searchObjectTypes } = require( './searchTypes' );
const { searchUsers } = require( './searchUsers' );
const { searchWobjects } = require( './searchWobjects' );

exports.getGlobalSearch = async ( { searchString, userLimit, wobjectsLimit, objectsTypeLimit } ) => {
    const { objectTypes, objectTypesCount } = await searchObjectTypes( { string: searchString, limit: objectsTypeLimit } );
    const { wobjects, wobjectsCounts } = await searchWobjects( { string: searchString, limit: wobjectsLimit } );
    const { users, usersCount } = await searchUsers( { string: searchString, limit: userLimit } );

    return { objectTypes, objectTypesCount, wobjects, wobjectsCounts, users, usersCount };
};
