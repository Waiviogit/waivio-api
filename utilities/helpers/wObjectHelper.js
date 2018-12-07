const {Wobj} = require('../../models');
const _ = require('lodash');

const combinedWObjectData = async (data) => {
    try {
        const {wObjectData} = await Wobj.getOne(data);             //get from db info about wobject
        return {wObjectData};
    } catch (error) {
        return {error};
    }
};

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

module.exports = {combinedWObjectData, formatRequireFields};