const UserModel = require('../database').models.User;
const userSteemUtil = require('../utilities/steemApi').userUtil;
const {wObjectHelper} = require('../utilities/helpers');
const {rankHelper} = require('../utilities/helpers');
const {REQUIREDFIELDS} = require('../utilities/constants');
const _ = require('lodash');

const getOne = async function (name) {
    try {
        const {userData, err} = await userSteemUtil.getAccount(name);   //get user data from STEEM blockchain
        if (err) {
            return {error}
        }
        const user = await UserModel.findOne({name: name}).lean();      //get user data from db
        if (!user) {
            return {userData}
        }
        await rankHelper.calculateForUserWobjects(user.w_objects);     //add rank to wobjects in user

        if (user) {
            user.objects_following_count = user.objects_follow.length;
        }
        Object.assign(userData, user);                                  //combine data from db and blockchain
        return {userData}
    } catch (error) {
        return {error}
    }
};

const getAll = async function ({limit, skip}) {
    try {
        return {UserData: await UserModel.find().skip(skip).limit(limit).lean()};
    } catch (error) {
        return {error}
    }
};
const create = async function (data) {
    const newUser = new UserModel(data);
    try {
        return {user: await newUser.save()};
    } catch (error) {
        return {error}
    }
};

const getObjectsFollow = async function (data) {        //list of wobjects which specified user is follow
    try {
        const user = await UserModel.findOne({name: data.name})
            .populate({
                path: 'full_objects_follow',
                options: {
                    limit: data.limit,
                    skip: data.skip,
                    sort: {weight: -1},
                    select: '-_id '
                }
            })                              //fill array author_permlink-s full info about wobject
            .select('objects_follow -_id')
            .lean();
        if (!user || !user.full_objects_follow) {
            return {wobjects: []}
        }
        const fields = REQUIREDFIELDS.map(item => ({name:item}));
        user.full_objects_follow.forEach((wObject) => {
            wObjectHelper.formatRequireFields(wObject, data.locale, fields);
        });

        await rankHelper.calculateWobjectRank(user.full_objects_follow);    //calculate rank for wobject

        return {wobjects: user.full_objects_follow}
    } catch (error) {
        return {error}
    }
};

const getUserObjectsShares = async function (data) {
    try {
        const wobjects = await UserModel.aggregate([
            {$match: {name: data.name}},
            {$unwind: '$w_objects'},
            {$sort:{'w_objects.weight': -1}},
            {$skip: data.skip},
            {$limit: data.limit},
            {$replaceRoot: {newRoot: '$w_objects'}},
            {$lookup: {from: 'wobjects',
                    localField: 'author_permlink',
                    foreignField: 'author_permlink',
                    as: 'wobject'}},
            {$unwind: '$wobject'},
            {$project:{
                    'wobject.user_weight':'$weight',
                    'wobject.is_posting_open': 1,
                    'wobject.is_extending_open': 1,
                    'wobject.author_permlink': 1,
                    'wobject.object_type': 1,
                    'wobject.default_name': 1,
                    'wobject.author': 1,
                    'wobject.creator': 1,
                    'wobject.app': 1,
                    'wobject.fields': 1,
                    'wobject.weight': 1
                }},
            {$replaceRoot:{newRoot:'$wobject'}}
        ]);
        let required_fields = [...REQUIREDFIELDS];
        const fields = required_fields.map(item => ({name: item}));
        wobjects.forEach((wObject) => {
            wObjectHelper.formatRequireFields(wObject, data.locale, fields);
        });
        rankHelper.calculateForUserWobjects(wobjects, true);
        const user = await UserModel.findOne({name: data.name}).lean();      //get user data from db
        return {objects_shares: {wobjects, wobjects_count: _.get(user, 'w_objects.length', 0)}};
    } catch (error) {
        return {error}
    }
};

module.exports = {create, getAll, getOne, getObjectsFollow, getUserObjectsShares};