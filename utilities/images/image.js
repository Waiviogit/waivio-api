const AWS = require( 'aws-sdk' );
const sharp = require( 'sharp' );

class Image {
    constructor () {
        const spacesEndpoint = new AWS.Endpoint( process.env.AWS_ENDPOINT );

        this._s3 = new AWS.S3( {
            endpoint: spacesEndpoint,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            params: {
                Bucket: 'waivio',
                ACL: 'public-read',
                ContentType: 'image/jpeg',
                ContentEncoding: 'base64'
            }
        } );
    }
    async uploadInS3 ( base64, fileName, size = '' ) {
        if ( base64 ) {
            const buffer = new Buffer( base64, 'base64' );
            const body = await this.resizeImage( { buffer, size } );

            return new Promise( ( resolve ) => {
                this._s3.upload( { Body: body, Key: `${fileName}${size}` }, ( err, data ) => {
                    if ( err ) {
                        resolve( { error: `Error upload image:${err}` } );
                    } if ( data ) {
                        resolve( { imageUrl: data.Location } );
                    }
                } );
            } );
        }
        return { error: 'Error parse image' };

    }
    async resizeImage ( { buffer, size } ) {
        if ( size === '_small' ) {
            return await sharp( buffer ).resize( 34, 34 ).toBuffer();
        } else if ( size === '_medium' ) {
            return await sharp( buffer ).resize( 180, 180 ).toBuffer();
        }
        return buffer;

    }
}

const image = new Image();

module.exports = image;
