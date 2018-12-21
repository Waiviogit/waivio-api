const WObjectModel = require('../database').models.WObject;
const {wObjectHelper} = require('../utilities/helpers');
const _ = require('lodash');

const addField = async function (data) {
    try {
        await WObjectModel.update({author_permlink: data.author_permlink},
            {
                $push:
                    {
                        fields: {
                            name: data.name,
                            body: data.body,
                            locale: data.locale,
                            author: data.author,
                            permlink: data.permlink
                        }
                    }
            });
        return {result: true};
    } catch (error) {
        return {error}
    }
};

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
            {name: 'locationCity'},
            {name: 'descriptionShort'}];
        wObjects.forEach((wObject) => {
            wObjectHelper.formatRequireFields(wObject, data.locale, requireFields);
        });

        return {wObjectsData: wObjects};
    } catch (error) {
        return {error}
    }
};

const getOne = async function (data) {      //get one wobject by author_permlink
    try {
        let wObject = await WObjectModel.findOne({'author_permlink': data.author_permlink})
            .populate('children', 'author_permlink')
            .populate('users', 'name w_objects profile_image')
            .select(' -_id -fields._id')
            .populate('followers', 'name')
            .lean();

        wObject.followers_count = wObject.followers.length;
        delete wObject.followers;

        formatUsers(wObject);
        const requiredFields = [
            'name',
            'description',
            'descriptionShort',
            'descriptionFull',
            'location',
            'locationCountry',
            'locationCity',
            'locationStreet',
            'locationAccomodation',
            'locationGPS',
            'postCode',
            'link',
            'linkFacebook',
            'linkTwitter',
            'linkYoutube',
            'linkInstagram',
            'linkVk',
            'avatarImage',
            'backgroundImage',
        ];
        getRequiredFields(wObject, requiredFields);

        return {wObjectData: wObject};
    } catch (error) {
        return {error};
    }
};

const getAll = async function (data) {
    try {
        let wObjects = await WObjectModel
            .find(data.author_permlinks ? {'author_permlink': {$in: data.author_permlinks}} : {})
            .populate('children', 'author_permlink')
            .populate('users', 'name w_objects profile_image')
            .select(' -_id -fields._id')
            .sort({weight: -1})
            .lean();
        const beginIndex = data.start_author_permlink ? wObjects.map(item => item.author_permlink).indexOf(data.start_author_permlink) + 1 : 0;
        wObjects = wObjects.slice(beginIndex, beginIndex + data.limit);

        const requireFields = [
            {name: 'avatarImage'},
            {name: 'name'},
            {name: 'link'},
            {name: 'locationCity'}];
        wObjects.forEach((wObject) => {
            formatUsers(wObject);
            wObject.children = wObject.children.map(item => item.author_permlink);  //correct format of children
            wObject.user_count = wObject.users.length;                  //add field user count
            wObject.users = wObject.users.filter((item, index) => index < data.user_limit);
            wObjectHelper.formatRequireFields(wObject, data.locale, requireFields);
        });

        return {wObjectsData: wObjects};
    } catch (error) {
        return {error}
    }
};

const getFields = async function (data) {
    try {
        const wObject = await WObjectModel
            .findOne({'author_permlink': data.author_permlink})
            .select('fields')
            .lean();
        return {fieldsData: _.orderBy(wObject.fields, ['weight'], ['desc'])}
    } catch (error) {
        return {error}
    }
};

const formatUsers = function (wObject) {

    wObject.users = wObject.users.map((user) => {
        let currentObj = user.w_objects.find((item) => item.author_permlink === wObject.author_permlink);
        return {
            name: user.name,
            profile_image: user.profile_image,
            weight: currentObj.weight,
            rank: currentObj.rank
        }
    });    //format users data
    wObject.users = _.orderBy(wObject.users, ['rank'], ['desc']);  //order users by rank
};

const getRequiredFields = function (wObject, requiredFields) {
    wObject.fields = wObject.fields.filter(item => requiredFields.includes(item.name));
};

module.exports = {create, addField, getAll, getOne, search, getFields};