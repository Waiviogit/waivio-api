const image = require( '../utilities/images/image' );
const { prepareImage } = require( '../utilities/helpers/imagesHelper' );

const saveImage = async function ( req, res ) {
    const { base64, fileName } = await prepareImage( req );
    const { imageUrl, error } = await image.uploadInS3( base64, fileName );

    if ( error ) {
        return res.status( 422 ).send( { error: error } );
    }
    if( !req.query.notResizing ) {
        await image.uploadInS3( base64, fileName, '_small' );
        await image.uploadInS3( base64, fileName, '_medium' );
    }
    return res.status( 200 ).json( { image: imageUrl } );
};

module.exports = { saveImage };
