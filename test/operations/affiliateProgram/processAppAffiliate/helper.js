const {
  faker,
} = require('test/testHelper');
const { FIELDS_NAMES } = require('constants/wobjectsData');

const createField = ({ name, weight, body } = {}) => ({
  name: name || faker.random.string(),
  weight: weight || 1,
  body: body || faker.random.string(),
});

const createAffiliateButton = ({ body, weight } = {}) => createField({
  name: FIELDS_NAMES.AFFILIATE_BUTTON,
  body: body || faker.internet.avatar(),
  weight: weight || 1,
});

const createAffiliateProductIdTypes = ({ body, weight } = {}) => createField({
  name: FIELDS_NAMES.AFFILIATE_PRODUCT_ID_TYPES,
  body: body || JSON.stringify(['asin']),
  weight: weight || 1,
});

const createAffiliateGeoArea = ({ body, weight } = {}) => createField({
  name: FIELDS_NAMES.AFFILIATE_GEO_AREA,
  body: body || JSON.stringify(['US', 'GLOBAL']),
  weight: weight || 1,
});

const createAffiliateUrlTemplate = ({ body, weight } = {}) => createField({
  name: FIELDS_NAMES.AFFILIATE_URL_TEMPLATE,
  body: body || 'https://amazon.com/dp/$productId/ref=?$affiliateCode',
  weight: weight || 1,
});

const createAffiliateCode = ({ body, weight } = {}) => createField({
  name: FIELDS_NAMES.AFFILIATE_CODE,
  body: body || JSON.stringify(['waivio.com', 'TEST_CODE']),
  weight: weight || 1,
});

const createFieldsForAffiliate = () => [
  createAffiliateButton(),
  createAffiliateProductIdTypes(),
  createAffiliateGeoArea(),
  createAffiliateUrlTemplate(),
  createAffiliateCode(),
];

module.exports = {
  createFieldsForAffiliate,
  createAffiliateGeoArea,
};
