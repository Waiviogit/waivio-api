const WObjectModel = require('../database').models.WObject;
const createError = require('http-errors');
const {wObjectHelper} = require('../utilities/helpers');
const {rankHelper} = require('../utilities/helpers');
const _ = require('lodash');
const {requiredFields} = require('../utilities/constants');

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
                $or: [{
                    'fields':
                        {
                            $elemMatch: {
                                'name': 'name',
                                'body': {$regex: `${data.string}`, $options: 'i'}
                            }
                        }
                },{
                    'author_permlink':{$regex:`${data.string}`, $options: 'i'}
                }]
            })
            .sort({weight: -1})
            .limit(data.limit)
            .select('-_id -fields._id')
            .lean();
        if (!wObjects || wObjects.length === 0) {
            return {wObjectsData: []};
        }

        const fields = requiredFields.map(item => ({ name:item }));
        wObjects.forEach((wObject) => {
            wObjectHelper.formatRequireFields(wObject, data.locale, fields);
        });

        await rankHelper.calculateWobjectRank(wObjects); //calculate rank for wobjects

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
        if (!wObject) {
            return {error: createError(404, 'wobject not found')}
        }
        wObject.preview_gallery = _.orderBy(wObject.fields.filter(field => field.name === 'galleryItem'), ['weight'],['asc']).slice(0,3);

        await rankHelper.calculateWobjectRank([wObject]); //calculate rank for wobject

        wObject.followers_count = wObject.followers.length;
        delete wObject.followers;

        formatUsers(wObject);

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
        if (!wObjects || wObjects.length === 0) {
            return {wObjectsData: []};
        }
        const beginIndex = data.start_author_permlink ? wObjects.map(item => item.author_permlink).indexOf(data.start_author_permlink) + 1 : 0;
        wObjects = wObjects.slice(beginIndex, beginIndex + data.limit);

        const fields = requiredFields.map(item => ({name: item}));
        wObjects.forEach((wObject) => {
            formatUsers(wObject);
            wObject.children = wObject.children.map(item => item.author_permlink);  //correct format of children
            wObject.user_count = wObject.users.length;                  //add field user count
            wObject.users = wObject.users.filter((item, index) => index < data.user_limit);
            wObjectHelper.formatRequireFields(wObject, data.locale, fields);
        });

        await rankHelper.calculateWobjectRank(wObjects); //calculate rank for wobject

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
        return {fieldsData: wObject ? _.orderBy(wObject.fields, ['weight'], ['desc']):[]}
    } catch (error) {
        return {error}
    }
};

const getGalleryItems = async function (data) {
    try {
        const gallery = await WObjectModel.aggregate([
            {
                $match:
                    {
                        author_permlink: data.author_permlink
                    }
            },
            {
                $unwind: '$fields'
            },
            {
                $match:
                    {
                        $or: [
                            {"fields.name": 'galleryItem'},
                            {"fields.name": 'galleryAlbum'}
                        ]

                    }
            },
            {
                $replaceRoot:
                    {
                        newRoot: '$fields'
                    }
            },
            {
                $group: {
                    _id: '$id',
                    items: {
                        $push: '$$ROOT'
                    }
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: '$items',
                                            as: 'item',
                                            cond: {$eq: ['$$item.name', 'galleryAlbum']}
                                        }
                                    },
                                    0
                                ]
                            },
                            {
                                items: {
                                    $filter: {
                                        input: '$items',
                                        as: 'item',
                                        cond: {$eq: ['$$item.name', 'galleryItem']}
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]);
        return {gallery};
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
            weight: currentObj.weight
        }
    });    //format users data
    rankHelper.calculateForUsers(wObject.users, wObject.weight);    //add rank in wobject for each user

    wObject.users = _.orderBy(wObject.users, ['rank'], ['desc']);  //order users by rank
};

const getRequiredFields = function (wObject, requiredFields) {
    wObject.fields = wObject.fields.filter(item => requiredFields.includes(item.name));
};

module.exports = {create, addField, getAll, getOne, search, getFields, getGalleryItems};