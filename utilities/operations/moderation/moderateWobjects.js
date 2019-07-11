const { schema } = require( './schema' );
const { App } = require( '../../../models' );
const _ = require( 'lodash' );
const MODERATION_KEY_FLAG = 'upvotedByModerator';

exports.moderate = async ( req, res, next ) => {
    /*
    First need to find app of current request, then correct scheme of location wobjects data in response, and then moderate it if need

    data locate on "res.result" => {status, json}
    app locate on "res.headers.app"
    */
    const { app, error: getAppErr } = await getApp( req );

    if( getAppErr && !app ) {
        console.error( getAppErr );
        next();
    }
    const { wobjects_path } = schema.find( ( s ) => s.path === req.route.path && s.method === req.method );
    const wobjects_data = res.result.json[ wobjects_path ];

    console.log( req );
};

const getApp = async ( req ) => {
    const app_name = _.get( req, 'headers.app' );

    if( !app_name ) {
        return;
    }
    return await App.getOne( { name: app_name } );

};

/*
Validation (moderation) means that to every field in each returned wobject which include UpVote or DownVote will be added some key,
    which indicate some specified behavior of this field/wobject.
 */
/**
 * Moderate wobjects by specified moderators
 * @param {Array} wobjects
 * @param {Array} moderators
 * @returns {Array} New array of wobjects.
 */
const validateWobjects = ( wobjects, moderators ) => {
    return map( ( wobject ) => {
        wobject.fields = validateFields( wobject, moderators );
        return wobject;
    } );

};

/**
 * Moderate wobject by specified moderators
 * Check every field in wobject to exist UpVote or DownVote from moderators, if UpVote exists => field marks some special key("upvotedByModerator") which indicate high priority of this field, else if DownVote exists => field remove from wobject fields
 * @param {Object}  wobject
 * @param {Array}   moderators
 * @returns {Array} New array of moderated fields
 */
const validateFields = ( wobject, moderators ) => {
    return wobject.fields.map( ( field ) => {
        for( const vote of field.active_votes ) {
            const moderator = moderators.find( ( m ) => m.name === vote.voter );

            if( moderator ) {
                switch( true ) {
                    case vote.weight < 0:
                        // remove field from fields array
                        return;
                    case vote.weight > 0:
                        // handle adding some key to field, indicate including moderate vote
                        field[ MODERATION_KEY_FLAG ] = true;
                        return field;
                }
            }
        }
        return field;
    } ).filter( Boolean ); // remove undefined items
};

