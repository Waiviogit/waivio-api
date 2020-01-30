const { importUserClient } = require( './redis' );

/**
 * Add user name to namespace of currently importing users
 * @param userName {String}
 * @returns {Promise<void>}
 */
exports.addImportedUser = async ( userName ) => {
    await importUserClient.setAsync( `import_user:${userName}`, new Date().toISOString() );
};

/**
 * Add user name to namespace of currently importing users
 * @param userName {String}
 * @param errorMessage {String}
 * @returns {Promise<void>}
 */
exports.setImportedUserError = async ( userName, errorMessage ) => {
    await importUserClient.setAsync( `import_user_error:${userName}`, errorMessage );
};

/**
 * Delete user name from list currently imported users
 * @param userName {String}
 */
exports.deleteImportedUser = ( userName ) => {
    importUserClient.del( `import_user:${userName}` );
};
