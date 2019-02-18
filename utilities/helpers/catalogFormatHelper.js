const _ = require('lodash');

const format = (items = []) => {
    items.forEach(item => {
        if (_.isEmpty(item.wobject))
            delete item.wobject;
        else item.wobject = item.wobject[0];
    });
    const objectLinks = items.filter(item => item.name === 'objectLink');
    items = _.reject(items, i => i.name === 'objectLink');
    const catalogs = items.filter(item => item.parent === '') || [];
    items = _.reject(items, i => i.name === '');
    return _.isEmpty(catalogs) ? [] : fillChildCatalog(catalogs, items, objectLinks);
};

const fillChildCatalog = (catalogs, items, objectLinks) => {
    for (const catalog of catalogs) {
        catalog.object_links = objectLinks.filter(o => o.catalog_item === catalog.permlink) || [] ;
        const childCatalogs = items.filter(item => item.parent === catalog.permlink) || [];
        catalog.items = _.isEmpty(childCatalogs) ? [] : fillChildCatalog(childCatalogs, items, objectLinks);
    }
    return catalogs;
};

module.exports = {format}