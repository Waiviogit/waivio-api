const image = require( '../utilities/images/image' );
const { prepareImage } = require( '../utilities/helpers/imagesHelper' );

const saveImage = async function ( req, res ) {
    const { base64, fileName } = await prepareImage( req );
    const { imageUrl, error } = await image.uploadInS3( base64, fileName );

    if ( error ) {
        res.status( 422 ).send( { error: error } );
    }
    await image.uploadInS3( base64, fileName, '_small' );
    await image.uploadInS3( base64, fileName, '_medium' );
    res.status( 200 ).json( { image: imageUrl } );
};

module.exports = { saveImage };
