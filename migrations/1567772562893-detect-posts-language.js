'use strict';
const { Post, User } = require( '../database' ).models;
const franc = require( 'franc-min' );
const _ = require( 'lodash' );

const regular_exp = /(?:!?\[(.*?)\]\((.*?)\))|(<\/?[^>]+(>|$))|(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g;
const languageList = {
    'en-US': 'eng',
    'id-ID': 'ind',
    'ms-MY': 'zlm',
    'ca-ES': 'cat',
    'cs-CZ': 'ces',
    'da-DK': 'dan',
    'de-DE': 'deu',
    'et-EE': 'est',
    'es-ES': 'spa',
    'fr-FR': 'fra',
    'hr-HR': 'hrv',
    'it-IT': 'ita',
    'hu-HU': 'hun',
    'nl-HU': 'nld',
    'no-NO': 'nno',
    'pl-PL': 'pol',
    'pt-BR': 'por',
    'ro-RO': 'ron',
    'sl-SI': 'slv',
    'sv-SE': 'swe',
    'vi-VN': 'vie',
    'tr-TR': 'tur',
    'yo-NG': 'yor',
    'el-GR': 'ell',
    'bg-BG': 'bul',
    'ru-RU': 'rus',
    'uk-UA': 'ukr',
    'he-IL': 'heb',
    'ar-SA': 'arb',
    'ne-NP': 'nep',
    'hi-IN': 'hin',
    'bn-IN': 'ben',
    'ta-IN': 'tam',
    'lo-LA': 'lao',
    'th-TH': 'tha',
    'ko-KR': 'kor',
    'ja-JP': 'jpn',
    'zh-CN': 'cmn'
};
/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up ( done ) {
    let cursor = Post.find().cursor( { batchSize: 1000 } );
    let success_count = 0;
    let fail_count = 0;

    await cursor.eachAsync( async ( doc ) => {
        let post = doc.toObject();
        const postAuthor = await User.findOne( { name: post.author }, { _id: 0, read_locales: 1, 'user_metadata.settings': 1 } ).lean();
        const userLocales = new Set( [
            ..._.get( postAuthor, 'read_locales', [] ),
            ..._.get( postAuthor, 'user_metadata.settings.postLocales', [] ),
            _.get( postAuthor, 'user_metadata.settings.locale' )
        ] );
        const language = detectPostLanguage( post.title, post.body, _.compact( Array.from( userLocales ) ) );

        const res = await Post.update( { author: post.author, permlink: post.permlink }, { $set: { language: language } } );
        if( res.nModified ) {
            success_count++;
            if( success_count % 5000 === 0 ) console.log( success_count + 'Posts successfully localise' );
        } else {
            fail_count++;
            if( fail_count % 5000 === 0 )console.error( fail_count );
        }
    } );
    console.log( `${success_count} posts successfully updated with language!\n${fail_count} posts fails on update.` );
    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down( done ) {
    await Post.update( {}, { $unset: { language: '' } } );
    console.log( 'Deleted field "status" from all of Wobjects!' );
    done();
};

const detectPostLanguage = ( title, body, userLanguages = [] ) => {
    // remove HTML tags from title/body and make single string to detect language
    let str = title.replace( regular_exp, '' ) + '\n';
    str += body.replace( regular_exp, '' );
    // get all possible languages from supported by us
    let existLanguages = franc.all( str, { only: Object.values( languageList ) } );
    existLanguages = existLanguages.map( ( item ) => ( {
        language: findCorrectLanguageFormat( item[ 0 ] ),
        rate: item[ 1 ]
    } ) );
    // if lib didn't match any language ¯\_(ツ)_/¯
    if ( _.isEmpty( existLanguages ) ) {
        // chose language from author language, english has priority
        if ( _.isEmpty( userLanguages ) || ( userLanguages.length === 1 && _.get( userLanguages, '[0]' ) === 'auto' ) ) {
            return 'en-US';
        }
        if ( userLanguages.includes( 'en-US' ) ) {
            return 'en-US';
        }
        const index = userLanguages.indexOf( 'auto' );
        if ( index !== -1 ) {
            userLanguages.splice( index, 1 );
        }
        return _.first( userLanguages );
    }
    // else if matched languages not empty, get top 5 matched languages, and overlap it with user languages
    const overlapLang = _
        .chain( existLanguages )
        .slice( 0, 5 )
        .filter( ( item ) => userLanguages.includes( item.language ) )
        .get( '[0].language' )
        .value();
    if ( overlapLang ) return overlapLang;
    // else just return top from matched languages
    return existLanguages[ 0 ].language;
};

/**
 * Format language code from "franc" library form( 'eng', 'rus' ) to correct form (e.g. 'en-US', 'ru-RU' etc.).
 * If it's no matches => return "en-US" by default
 * @param lang3Format Required param, language in format of 3 letter, e.g. eng, rus, etc.
 */
const findCorrectLanguageFormat = ( lang3Format ) => {
    return _.chain( languageList ).invert().get( lang3Format, 'en-US' ).value();
};
