const UserModel = require('../database').models.User;

const getOne = async function (name) {
    try {
        return {user: await UserModel.findOne({name: name}).lean()};
    } catch (error) {
        return {error}
    }
};

const getAll = async function () {
    try {
        return {UserData: await UserModel.find()};
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

module.exports = {create, getAll, getOne};