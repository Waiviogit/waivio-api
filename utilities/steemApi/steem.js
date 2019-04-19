const config = require( '../../config' );
const { Client } = require( 'dsteem' );
const client = new Client( config.nodeUrl );

module.exports = { client };
