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

const search = async function (data) {
    try {
        const wObjects = await WObjectModel
            .find({
                'fields':
                    {
                        $elemMatch: {
                            'name': 'name',
                            'body': {$regex: `^${data.string}`, $options: 'i'}
                        }
                    }
            })
            .sort({weight: -1})
            .limit(data.limit)
            .select('-_id -fields._id')
            .lean();
        const requireFields = [
            {name: 'avatarImage'},
            {name: 'name'},
            {name: 'link'},
            {name: 'locationCity'}];
        wObjects.forEach((wObject) => {
            formatFields(wObject, data.locale, requireFields);
        });

        return {wObjectsData: wObjects};
    } catch (error) {
        return {error}
    }
};

const getOne = async function (data) {      //get one wobject by authorPermlink
    try {
        let wObject = await WObjectModel.findOne({'authorPermlink': data.authorPermlink})
            .populate('children', 'authorPermlink')
            .populate('users', 'name wObjects profile_image')
            .select(' -_id -fields._id')
            .lean();
        formatUsers(wObject);
        wObject.followersCount = wObject.followersNames ? wObject.followersNames.length : 0;
        const requireFields = [
            {name: 'name'},
            {name: 'descriptionShort'},
            {name: 'descriptionFull'},
            {name: 'locationCountry'},
            {name: 'locationCity'},
            {name: 'locationStreet'},
            {name: 'locationAccomodation'},
            {name: 'locationGPS'},
            {name: 'postCode'},
            {name: 'link'},
            {name: 'linkFacebook'},
            {name: 'linkTwitter'},
            {name: 'linkYoutube'},
            {name: 'linkInstagram'},
            {name: 'linkVk'},
            {name: 'avatarImage'},
            {name: 'backgroundImage'}
        ];
        formatFields(wObject, data.locale, requireFields);
        return {wObjectData: wObject};
    } catch (error) {
        return {error};
    }
};

const getAll = async function (data) {
    try {
        let wObjects = await WObjectModel
            .find(data.authorPermlinks ? {'authorPermlink': {$in: data.authorPermlinks}} : {})
            .populate('children', 'authorPermlink')
            .populate('users', 'name wObjects profile_image')
            .select(' -_id -followersNames -fields._id')
            .sort({weight: -1})
            .lean();
        const beginIndex = data.startAuthorPermlink ? wObjects.map(item => item.authorPermlink).indexOf(data.startAuthorPermlink) + 1 : 0;
        wObjects = wObjects.slice(beginIndex, beginIndex + data.limit);

        const requireFields = [
            {name: 'avatarImage'},
            {name: 'name'},
            {name: 'link'},
            {name: 'locationCity'}];
        wObjects.forEach((wObject) => {
            formatUsers(wObject);
            wObject.children = wObject.children.map(item => item.authorPermlink);  //correct format of children
            wObject.user_count = wObject.users.length;                  //add field user count
            wObject.users = wObject.users.filter((item, index) => index < data.userLimit);
            formatFields(wObject, data.locale, requireFields);
        });

        return {wObjectsData: wObjects};
    } catch (error) {
        return {error}
    }
};

const getFields = async function (data) {
    try {
        const wObject = await WObjectModel
            .findOne({'authorPermlink': data.authorPermlink})
            .select('fields')
            .lean();
        return {fieldsData: _.orderBy(wObject.fields, ['weight'],['desc'])}
    } catch (error) {
        return {error}
    }
};

const formatUsers = function (wObject) {

    wObject.users = wObject.users.map((user) => {
        let currentObj = user.wObjects.find((item) => item.authorPermlink === wObject.authorPermlink);
        return {
            name: user.name,
            profile_image: user.profile_image,
            weight: currentObj.weight,
            rank: currentObj.rank
        }
    });    //format users data
    wObject.users = _.orderBy(wObject.users, ['rank'], ['desc']);  //order users by rank
};

const formatFields = function (wObject, locale, requireFields) {
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
module.exports = {create, getAll, getOne, search, getFields};