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

    if( getAppErr || !app ) {
        next();
        return;
    }
    const current_schema = schema.find( ( s ) => s.path === req.route.path && s.method === req.method );

    if( !current_schema ) {
        next();
        return;
    }

    switch( current_schema.case ) {
        case 1:
            // root result is single wobject
            res.result.json = validateWobject( res.result.json, app.moderators );
            break;
        case 2:
            // root result is array of wobjects
            res.result.json = validateWobjects(
                res.result.json,
                app.moderators,
                current_schema.author_permlink_path,
                current_schema.fields_path
            );
            break;
        case 3:
            // root result is Object with array obj wobjects
            res.result.json[ current_schema.wobjects_path ] = validateWobjects(
                res.result.json[ current_schema.wobjects_path ],
                app.moderators
            );
            break;
        case 4:
            // root result is array of objects (ex. posts), where each has prop array of wobjects
            res.result.json = validateWobjectsEmbeddedArray(
                res.result.json,
                app.moderators,
                current_schema.wobjects_path
            );
            break;
        case 5:
            // root result is array of fields (gallery, list, fields)
            res.result.json = validateFields( { author_permlink: req.author_permlink, fields: res.result.json }, app.moderators );
            break;
    }
    next();
};

/**
 * Get app name from request headers and find app with specified name in database
 * @param {Object} req instance of current request
 * @returns {Object} app, error
 */
const getApp = async ( req ) => {
    const app_name = _.get( req, 'headers.app' );

    if( !app_name ) {
        return {};
    }
    return App.getOne( { name: app_name } );
};

/*
Validation (moderation) means that to every field in each returned wobject which include UpVote or DownVote will be added some key,
    which indicate some specified behavior of this field/wobject.
 */
/**
 * Moderate wobjects by specified moderators
 * @param {Array} wobjects
 * @param {Array} moderators
 * @param {string} ap_path, custom location of author_permlink, default is "author_permlink"
 * @param {string} fields_path, custom location of fields, default is "fields"
 * @returns {Array} New array of wobjects.
 */
const validateWobjects = ( wobjects = [], moderators, ap_path = 'author_permlink', fields_path = 'fields' ) => {
    return _.map( wobjects, ( wobject ) => {
        wobject[ fields_path ] = validateFields( wobject, moderators, ap_path, fields_path );
        return wobject;
    } );
};

const validateWobject = ( wobject, moderators ) => {
    wobject.fields = validateFields( wobject, moderators );
    return wobject;
};

const validateWobjectsEmbeddedArray = ( root_array, moderators, wobjects_path = 'wobjects' ) => {
    return root_array.map( ( root_doc ) => {
        if( root_doc[ wobjects_path ] ) {
            root_doc[ wobjects_path ] = validateWobjects( root_doc[ wobjects_path ], moderators );
        }
        return root_doc;
    } );
};

/**
 * Moderate wobject by specified moderators
 * Check every field in wobject to exist UpVote or DownVote from moderators,
 * if UpVote exists => field marks some special key("upvotedByModerator") which indicate high priority of this field,
 * else if DownVote exists => field remove from wobject fields
 * @param {Object}  wobject
 * @param {Array}   moderators
 * @param {string} ap_path, custom location of author_permlink, default is "author_permlink"
 * @param {string} fields_path, custom location of fields, default is "fields"
 * @returns {Array} New array of moderated fields
 */
const validateFields = ( wobject, moderators, ap_path = 'author_permlink', fields_path = 'fields' ) => {
    return _.get( wobject, `[ ${fields_path} ]`, [] ).map( ( field ) => {
        for( const vote of field.active_votes ) {
            const moderator = moderators.find( ( m ) => m.name === vote.voter && m.author_permlinks.includes( wobject[ ap_path ] ) );

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

