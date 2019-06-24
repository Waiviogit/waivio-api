const image = require( '../utilities/images/image' );
const uuid = require( 'uuid/v4' );

const saveImage = async function ( req, res ) {
    const base64 = req.body.image && req.body.image.split( ',' )[ 1 ];
    const fileName = `${Math.round( new Date() / 1000 )}_${uuid()}`;
    const { imageUrl, error } = await image.uploadInS3( { base64, fileName } );

    if ( error ) {
        res.status( 422 ).send( { error: error } );
    }
    await image.uploadInS3( { base64, fileName, size: '_small' } );
    await image.uploadInS3( { base64, fileName, size: '_medium' } );
    res.status( 200 ).json( { image: imageUrl } );
};

module.exports = { saveImage };
