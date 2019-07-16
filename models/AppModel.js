const App = require( '../database' ).models.App;

const getOne = async ( { name } ) => {
    try {
        const app = await App.findOne( { name } ).lean();

        if ( !app ) {
            throw { status: 404, message: 'App not found!' };
        }
        return { app };
    } catch ( error ) {
        return { error };
    }
};

const aggregate = async ( pipeline ) => {
    try {
        const result = await App.aggregate( pipeline );

        if( !result ) {
            return { error: { status: 404, message: 'Not found!' } };
        }
        return { result };
    } catch ( error ) {
        return { error };
    }
};

module.exports = { getOne, aggregate };
