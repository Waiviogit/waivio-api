const WObjectModel = require('../database').models.WObject;
const createError = require('http-errors');
const wObjectHelper = require('../utilities/helpers/wObjectHelper');
const rankHelper = require('../utilities/helpers/rankHelper');
const _ = require('lodash');
const {REQUIREDFIELDS} = require('../utilities/constants');

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
                $and: [{
                    $or: [{
                        'fields':
                            {
                                $elemMatch: {
                                    'name': 'name',
                                    'body': {$regex: `${data.string}`, $options: 'i'}
                                }
                            }
                    }, {
                        'author_permlink': {$regex: `${data.string}`, $options: 'i'}
                    }]
                }, {
                    object_type: {$regex: `${data.object_type || '.+'}`, $options: 'i'}
                }]
            })
            .sort({weight: -1})
            .limit(data.limit)
            .select('-_id -fields._id')
            .lean();
        if (!wObjects || wObjects.length === 0) {
            return {wObjectsData: []};
        }

        const fields = REQUIREDFIELDS.map(item => ({ name:item }));
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
        let required_fields = [...REQUIREDFIELDS];
        let wObject = await WObjectModel.findOne({'author_permlink': data.author_permlink})
            .populate('parent_objects')
            .populate('child_objects')
            .populate({
                path: 'users',
                select: 'name w_objects profile_image',
                options: {sort: {'w_objects.weight': -1},  limit: 10}
            })
            .select(' -_id -fields._id')
            .populate('followers', 'name')
            .lean();
        if (!wObject) {
            return {error: createError(404, 'wobject not found')}
        }
        if(wObject.object_type.toLowerCase() === 'list'){
            const {wobjects, sortCustom} = await getList(data.author_permlink);
            wObject.listItems = wobjects;
            wObject.sortCustom = sortCustom;
            required_fields.push('sortCustom','listItem');
        }
        wObject.preview_gallery = _.orderBy(wObject.fields.filter(field => field.name === 'galleryItem'), ['weight'],['asc']).slice(0,3);
        wObject.albums_count = wObject.fields.filter(field=>field.name==='galleryAlbum').length;
        wObject.photos_count = wObject.fields.filter(field=>field.name==='galleryItem').length;
        await rankHelper.calculateWobjectRank([wObject]); //calculate rank for wobject

        wObject.followers_count = wObject.followers.length;
        delete wObject.followers;

        formatUsers(wObject);

        if (data.required_fields && ((Array.isArray(data.required_fields) && data.required_fields.length && data.required_fields.every(_.isString)) || _.isString(data.required_fields)))
            if (_.isString(data.required_fields)) required_fields.push(data.required_fields);
            else required_fields.push(...data.required_fields); //add additional fields to returning

        getRequiredFields(wObject, required_fields);
        if(wObject.parent_objects) wObject.parent_objects.forEach(parent => getRequiredFields(parent, required_fields));
        if(wObject.child_objects) wObject.child_objects.forEach(child => getRequiredFields(child, required_fields));

        return {wObjectData: wObject};
    } catch (error) {
        return {error};
    }
};

const getAll = async function (data) {
    try {
        const findParams = {};
        if (data.author_permlinks && Array.isArray(data.author_permlinks) && data.author_permlinks.length)
            findParams.author_permlink = {$in: data.author_permlinks};
        if (data.object_types && Array.isArray(data.object_types) && data.object_types.length)
            findParams.object_type = {$in: data.object_types};
        let wObjects;
        if (data.user_limit !== 0) {
            wObjects = await WObjectModel
                .find(findParams)
                .populate({
                    path: 'users',
                    select: 'name w_objects profile_image',
                    options: {sort: {'w_objects.weight': -1}, limit: data.user_limit}
                })
                .select(' -_id -fields._id')
                .sort({weight: -1})
                .skip(data.skip)
                .limit(data.limit)
                .lean();
        } else {
            wObjects = await WObjectModel.aggregate([
                {$match: findParams},
                {$sort: {weight: -1}},
                {$skip: data.skip},
                {$limit: data.limit}
            ]);
        }
        if (!wObjects || wObjects.length === 0) {
            return {wObjectsData: []};
        }

        let required_fields = [...REQUIREDFIELDS];
        if(data.required_fields && Array.isArray(data.required_fields) && data.required_fields.length && data.required_fields.every(_.isString))
            required_fields.push(...data.required_fields); //add additional fields to returning
        const fields = required_fields.map(item => ({name: item}));

        wObjects.forEach((wObject) => {
            wObject.users = wObject.users || [];
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
            {$match:{author_permlink: data.author_permlink}},
            {$unwind: '$fields'},
            {$match:{$or: [{"fields.name": 'galleryItem'},
                            {"fields.name": 'galleryAlbum'}]}},
            {$replaceRoot:{newRoot: '$fields'}},
            {$group: {_id: '$id',items: {$push: '$$ROOT'}}},
            {$replaceRoot: {newRoot: {$mergeObjects: [
                            {$arrayElemAt: [{$filter: {input: '$items',as: 'item',cond: {$eq: ['$$item.name', 'galleryAlbum']}}},0]},
                            {items: {$filter: {input: '$items',as: 'item',cond: {$eq: ['$$item.name', 'galleryItem']}}}}
                        ]}}}
        ]);
        const rootAlbum = {id: data.author_permlink, name: 'galleryAlbum',body:'Photos', items:[]};
        for(const i in gallery) {
            if (!gallery[i].id) {
                gallery[i] = {...rootAlbum, ...gallery[i]};
                return {gallery}
            }
        }
        gallery.push(rootAlbum);
        return {gallery};
    } catch (error) {
        return {error}
    }
};

const getList = async function (author_permlink) {
    try {
        const fields = await WObjectModel.aggregate([
            {$match:{author_permlink: author_permlink}},
            {$unwind:'$fields'},
            {$replaceRoot:{newRoot:'$fields'}},
            {$match:{$or:[{name:'listItem'},{name:'sortCustom'}]}},
            {
                $lookup: {
                    from: 'wobjects',
                    localField:'body',
                    foreignField: 'author_permlink',
                    as:'wobject'
                }
            }
        ]);
        const sortCustomField = _.maxBy(fields.filter(field=>field.name==='sortCustom'),'weight');
        const wobjects = _.map(fields.filter(field=>field.name==='listItem'),field=>field.wobject[0]);
        await rankHelper.calculateWobjectRank(wobjects);
        wobjects.forEach((wObject)=>getRequiredFields(wObject, [...REQUIREDFIELDS]));
        return{wobjects, sortCustom: JSON.parse(_.get(sortCustomField,'body','[]'))}
    } catch (error) {
        return {error}
    }
};

const getObjectExpertise = async function(data){    //data include author_permlink, skip, limit
    try{
        const users = await WObjectModel.aggregate([
            {$match: {author_permlink: data.author_permlink}},
            {
                $lookup: {
                    from: 'users',
                    localField: 'author_permlink',
                    foreignField: 'w_objects.author_permlink',
                    as: 'object_expertise'
                }
            },
            {$unwind: '$object_expertise'},
            {$unwind: '$object_expertise.w_objects'},
            {$match: {'object_expertise.w_objects.author_permlink': data.author_permlink}},
            {$replaceRoot: {newRoot: '$object_expertise'}},
            {$sort:{w_objects:-1}},
            {$skip:data.skip},
            {$limit:data.limit},
            {$project: {_id:0,name:1,weight:'$w_objects.weight'}}
        ]);
        const wObject = await WObjectModel.findOne({author_permlink:data.author_permlink}).select('weight').lean();

        rankHelper.calculateForUsers(users, wObject.weight);    //add rank in wobject for each user
        return {users}
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

    wObject.users = _.orderBy(wObject.users, ['weight'], ['desc']);  //order users by rank
};

const getRequiredFields = function (wObject, requiredFields) {
    wObject.fields = wObject.fields.filter(item => requiredFields.includes(item.name));
};

module.exports = {create, addField, getAll, getOne, search, getFields, getGalleryItems, getList, getObjectExpertise};