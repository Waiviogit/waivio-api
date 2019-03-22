const AppModel = require('../database').models.App;

const getOne = async ({name}) => {
    try {
        const app = await AppModel.findOne({name}).lean();
        if (!app) {
            return {error: {status: 404, message: 'App not found!'}}
        }
        if (!app) {
            throw {error: {status: 404, message: 'App not found!'}}
        }
        return {app}
    } catch (error) {
        return {error}
    }
};

module.exports = {getOne}