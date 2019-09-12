'use strict';
const { Post, User } = require( '../database' ).models;
const franc = require( 'franc-min' );
const _ = require( 'lodash' );

const languageList = [
    { 'en-US': 'eng' },
    { 'id-ID': 'ind' },
    { 'ms-MY': 'zlm' },
    { 'ca-ES': 'cat' },
    { 'cs-CZ': 'ces' },
    { 'da-DK': 'dan' },
    { 'de-DE': 'deu' },
    { 'et-EE': 'est' },
    { 'es-ES': 'spa' },
    { 'fr-FR': 'fra' },
    { 'hr-HR': 'hrv' },
    { 'it-IT': 'ita' },
    { 'hu-HU': 'hun' },
    { 'nl-HU': 'nld' },
    { 'no-NO': 'nno' },
    { 'pl-PL': 'pol' },
    { 'pt-BR': 'por' },
    { 'ro-RO': 'ron' },
    { 'sl-SI': 'slv' },
    { 'sv-SE': 'swe' },
    { 'vi-VN': 'vie' },
    { 'tr-TR': 'tur' },
    { 'yo-NG': 'yor' },
    { 'el-GR': 'ell' },
    { 'bg-BG': 'bul' },
    { 'ru-RU': 'rus' },
    { 'uk-UA': 'ukr' },
    { 'he-IL': 'heb' },
    { 'ar-SA': 'arb' },
    { 'ne-NP': 'nep' },
    { 'hi-IN': 'hin' },
    { 'bn-IN': 'ben' },
    { 'ta-IN': 'tam' },
    { 'lo-LA': 'lao' },
    { 'th-TH': 'tha' },
    { 'ko-KR': 'kor' },
    { 'ja-JP': 'jpn' },
    { 'zh-CN': 'cmn' }
];
/**
 * Make any changes you need to make to the database here
 */
// exports.up = async function up ( done ) {
const up = async function ( done ) {
    let cursor = Post.find( ).limit( 100 ).cursor( { batchSize: 1000 } );

    await cursor.eachAsync( async ( doc ) => {
        let post = doc.toObject();
        let postAuthor = await User.findOne( { name: post.author }, { _id: 0, read_locales: 1, 'user_metadata.settings': 1 } ).lean();
        let userLocales = new Set( [ ..._.get( postAuthor, 'read_locales' ), ..._.get( postAuthor, 'user_metadata.settings.postLocales' ), _.get( postAuthor, 'user_metadata.settings.locale' ) ] );
        let language = detectPostLanguage( post.title, post.body, Array.from( userLocales ) );
        console.log( `For post ${post.author}/${post.permlink} language is: ${language}` );
    } );
    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down( done ) {
    done();
};

const detectPostLanguage = ( title, body, userLanguages = [] ) => {
    // remove HTML tags from title/body and make single string to detect language
    let str = title.replace( /<\/?[^>]+(>|$)/g, '' ) + '\n';
    str += body.replace( /<\/?[^>]+(>|$)/g, '' );
    let existLanguages = franc.all( str, { only: [ ...languageList.map( ( item ) => item[ Object.keys( item )[ 0 ] ] ) ] } );
    existLanguages = existLanguages.map( ( item ) => ( { language: findCorrectLanguageFormat( item[ 0 ] ), rate: item[ 1 ] } ) );
    // if lib didn't match any language ¯\_(ツ)_/¯
    if( _.isEmpty( existLanguages ) ) {
        if( _.isEmpty( userLanguages ) || ( userLanguages.length === 1 && _.get( userLanguages, '[0]' === 'auto' ) ) ) {
            return 'en-US';
        }
        if( userLanguages.includes( 'en-US' ) ) return 'en-US';
        const index = userLanguages.indexOf( 'auto' );
        if ( index !== -1 ) userLanguages.splice( index, 1 );
        return _.first( userLanguages );
    }
    // else if matched languages not empty
    const overlapLang = _
        .chain( existLanguages )
        .slice( 0, 5 )
        .filter( ( item ) => userLanguages.includes( item.language ) )
        .get( '[0].language' )
        .value();
    if( overlapLang ) return overlapLang;
    // else just return top from matched languages
    return existLanguages[ 0 ].language;
};

/**
 * Format language code from "franc" library form( 'eng', 'rus' ) to correct form (e.g. 'en-US', 'ru-RU' etc.)
 * @param lang3Format Required param, language in format of 3 letter, e.g. eng, rus, etc.
 */
const findCorrectLanguageFormat = ( lang3Format ) => {
    const index = languageList.indexOf( ( l ) => l === lang3Format );
    if( index !== -1 ) return _.get( languageList, `[${index}].language` );
};

( async () => {
    await up();
    // console.log( franc.all( 'Check my latest fight ! abbak7 vs meteorita\n' ) );
} )();

