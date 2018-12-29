const _ = require('lodash');
const UserModel = require('../../database/schemas/UserSchema');
const Post = require('../../models/PostModel');


const formatRequireFields = function (wObject, locale, requireFields) {
    const temp = _.reduce(wObject.fields, (resArr, field) => {
        const currResField = resArr.find(item => item.name === field.name);
        if (currResField && (!currResField.weight || currResField.weight < field.weight)) {
            resArr = resArr.map(item => item.name === field.name ? field : item);
        }
        return resArr;
    }, requireFields).filter(item => item.weight);

    wObject.fields = _.reduce(wObject.fields, (resArr, field) => {
        const currResField = resArr.find(item => item.name === field.name);
        if (currResField) {
            if (currResField.locale !== locale && field.locale === locale) {
                resArr = resArr.map(item => item.name === field.name ? field : item);
            } else if (currResField.locale === locale && currResField.weight < field.weight && field.locale === locale) {
                resArr = resArr.map(item => item.name === field.name ? field : item);
            }
        }
        return resArr;
    }, temp);
};    // get best fields(avatarImage, name, location and link) in location, or just best field if is have no field in locale

/**
 * @param data include user, limit, skip
 * @returns {Promise<void>} return array of posts
 */
const userFeedByObjects = async function (data) {
    const user = await UserModel.findOne({name: data.user}).lean();      //get user data from db
    if (!user) {
        return [];
    }
    data = {
        objects: user.objects_follow
    };
    const {posts, error} = await Post.getFeedByObjects(data);
    if (error) {
        return {error}
    }
    return {posts}
};

module.exports = {formatRequireFields, userFeedByObjects};