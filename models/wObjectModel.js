const WObjectModel = require('../database').models.WObject;
const _ = require('lodash');

const create = async function (data) {
    const newWObject = new WObjectModel(data);
    try {
        return {wObject: await newWObject.save()};
    } catch (error) {
        return {error}
    }
};

const getByTag = async function (data) {
    try {
        let wObject = await WObjectModel.findOne({'tag': data.tag})
            .populate('children', 'tag')
            .populate('users', 'name wObjects profile_image')
            .select(' -_id -fields._id')
            .lean();
        formatUsers(wObject);
        wObject.followersCount = wObject.followersNames ? wObject.followersNames.length : 0;

        return {wObjectData: wObject};
    } catch (error) {
        return {error};
    }
};

const getAll = async function (data) {
    try {
        const wObjects = await WObjectModel
            .find(data.tags ? {'tag': {$in: data.tags}} : {})
            .populate('children', 'tag')
            .populate('users', 'name wObjects profile_image')
            .select(' -_id -followersNames -fields._id')
            .lean();

        wObjects.forEach((wObject) => {
            formatUsers(wObject);
            wObject.children = wObject.children.map(item => item.tag);  //correct format of children
            wObject.user_count = wObject.users.length;                  //add field user count
            wObject.users = wObject.users.filter((item, index) => index < data.userLimit);
            formatFields(wObject, data.locale);
        });

        return {wObjectsData: wObjects};
    } catch (error) {
        return {error}
    }
};

const formatUsers = function (wObject) {

    wObject.users = wObject.users.map((user) => {
        let currentObj = user.wObjects.find((item) => item.tag === wObject.tag);
        return {
            name: user.name,
            profile_image: user.profile_image,
            weight: currentObj.weight,
            rank: currentObj.rank
        }
    });    //format users data
    wObject.users = _.orderBy(wObject.users, ['rank'],['desc']);  //order users by rank
};

const formatFields = function(wObject, locale){
    const requireFields = [{name:'avatarImage'},{name:'name'},{name:'link'},{name:'locationCity'}];
    const temp = _.reduce(wObject.fields, (resArr, field)=>{
        const currResField = resArr.find(item => item.name===field.name);
        if( currResField && (!currResField.weight || currResField.weight < field.weight) ){
            resArr = resArr.map(item => item.name === field.name ? field : item);
        }
        return resArr;
    }, requireFields).filter(item => item.weight);

    wObject.fields = _.reduce(wObject.fields, (resArr, field)=>{
        const currResField = resArr.find(item => item.name === field.name);
        if( currResField ){
            if(currResField.locale !== locale && field.locale === locale ){
                resArr = resArr.map(item => item.name === field.name ? field : item);
            } else if (currResField.locale === locale && currResField.weight < field.weight && field.locale === locale) {
                resArr = resArr.map(item => item.name === field.name ? field : item);
            }
        }
        return resArr;
    }, temp);
};    // get best fields(avatarImage, name, location and link) in location, or just best field if is not field in location
module.exports = {create, getAll, getByTag};