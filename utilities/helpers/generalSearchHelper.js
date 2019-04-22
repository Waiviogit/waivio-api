const WObject = require( '../../models/wObjectModel' );
const ObjectType = require( '../../models/ObjectTypeModel' );
const { userUtil } = require( '../steemApi' );

const search = async ( { searchString = '', userLimit = 20, wobjectsLimit = 20, objectsTypeLimit = 20 } = {} ) => {
    const { wObjectsData = [] } = await WObject.search( { string: searchString, limit: wobjectsLimit } );
    const { objectTypes = [] } = await ObjectType.search( { string: searchString, limit: objectsTypeLimit } );
    const { accounts = [] } = await userUtil.searchUserByName( searchString, userLimit );

    return { wobjects: wObjectsData, objectTypes, accounts };
};

module.exports = { search };
