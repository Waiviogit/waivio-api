const uuid = require( 'uuid/v4' );
const formidable = require( 'formidable' );
const fs = require( 'fs' );
const axios = require( 'axios' );

const prepareImage = async ( req ) => {
    const form = new formidable.IncomingForm();
    const { blobImage, imageUrl } = await new Promise( ( resolve, reject ) => {
        form.parse( req, ( err, fields, files ) => {
            if ( err ) {
                reject( err );
                return;
            }
            resolve( { blobImage: files.image, imageUrl: fields.imageUrl } );
        } );
    } );
    let base64 = null;

    if( blobImage ) {
        const data = fs.readFileSync( blobImage.path );

        base64 = data.toString( 'base64' );
    } else if( imageUrl ) {
        base64 = await base64ByUrl( imageUrl );
    }
    const fileName = `${Math.round( new Date() / 1000 )}_${uuid()}`;

    return { base64: base64, fileName: fileName };
};


const base64ByUrl = async( url ) => {
    return axios
        .get( url, {
            responseType: 'arraybuffer'
        } )
        .then( ( response ) => new Buffer( response.data, 'binary' ).toString( 'base64' ) );
};

module.exports = { prepareImage };
