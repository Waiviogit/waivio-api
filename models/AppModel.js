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

module.exports = { getOne };
