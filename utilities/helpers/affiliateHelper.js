const _ = require('lodash');
const jsonHelper = require('./jsonHelper');
const {
  DEFAULT_COUNTRY_CODE,
  AMAZON_LINKS_BY_COUNTRY,
  AFFILIATE_TYPE,
  AMAZON_PRODUCT_IDS,
  WALMART_PRODUCT_IDS,
  TARGET_PRODUCT_IDS,
  AFFILIATE_NULL_TYPES,
} = require('../../constants/wobjectsData');
const AppAffiliateModel = require('../../models/AppAffiliateModel');
const config = require('../../config');

const findAffiliateCode = (affiliateCodes, countryCode) => {
  let code;
  let defaultCode;

  for (const aff of affiliateCodes) {
    if (aff.type === 'amazon') {
      if (aff.countryCode === countryCode) {
        code = aff;
      } else if (aff.countryCode === DEFAULT_COUNTRY_CODE) {
        defaultCode = aff;
      }
    }

    if (code && defaultCode) {
      break;
    }
  }

  return code || defaultCode;
};

const getDefaultAmazonLink = ({ affiliateCodes, productId, countryCode }) => {
  const affiliate = findAffiliateCode(affiliateCodes, countryCode);

  if (!affiliate) return;

  const host = AMAZON_LINKS_BY_COUNTRY[affiliate.countryCode];
  const link = `https://www.${host}/dp/${productId}/ref=nosim?tag=${affiliate.affiliateCode}`;

  return { type: AFFILIATE_TYPE.AMAZON, link };
};

const formAmazonLink = ({
  affiliateCodes, productId, productIdType, countryCode,
}) => {
  if (_.isEmpty(affiliateCodes) && productId) {
    return { type: AFFILIATE_TYPE.AMAZON, link: `https://www.${AMAZON_LINKS_BY_COUNTRY.US}/dp/${productId}` };
  }
  if (Object.values(AMAZON_LINKS_BY_COUNTRY).includes(productIdType)) {
    const inverted = _.invert(AMAZON_LINKS_BY_COUNTRY);
    const affiliate = _.find(
      affiliateCodes,
      (aff) => aff.type === 'amazon' && aff.countryCode === inverted[productIdType],
    );
    if (affiliate) {
      return { type: AFFILIATE_TYPE.AMAZON, link: `https://www.${productIdType}/dp/${productId}/ref=nosim?tag=${affiliate.affiliateCode}` };
    }
    return { type: AFFILIATE_TYPE.AMAZON, link: `https://www.${productIdType}/dp/${productId}` };
  }

  return getDefaultAmazonLink({ affiliateCodes, productId, countryCode });
};

const formWalmartLink = ({ productId }) => {
  const link = `https://www.walmart.com/ip/${productId}`;
  return { type: AFFILIATE_TYPE.WALMART, link };
};

const formTargetLink = ({ productId }) => {
  const link = `https://www.target.com/p/${productId}`;
  return { type: AFFILIATE_TYPE.TARGET, link };
};

const specialAmazonLink = ({
  productIdObj, defaultCountryCode, requestCountryCode, mappedProductIds = [], countryCode,
}) => {
  if (AFFILIATE_NULL_TYPES.includes(productIdObj.productId.toLocaleLowerCase())) {
    const productObj = mappedProductIds.find(
      (mp) => AMAZON_PRODUCT_IDS.includes(mp.productIdType.toLocaleLowerCase()),
    );
    if (!productObj) return;

    return formAmazonLink({
      affiliateCodes: defaultCountryCode,
      productId: productObj.productId,
    });
  }

  return formAmazonLink({
    affiliateCodes: requestCountryCode,
    productId: productIdObj.productId,
    countryCode,
  });
};

const formAffiliateLinks = ({ affiliateCodes = [], productIds, countryCode }) => {
  const links = new Map();
  const mappedProductIds = _.compact(_.map(productIds, (el) => {
    const body = jsonHelper.parseJson(el.body, {});
    if (!_.get(body, 'productIdType')) return;
    return {
      productId: body.productId,
      productIdType: body.productIdType,
    };
  }));
  const requestCountryCode = affiliateCodes.filter(
    (aff) => aff.countryCode === countryCode,
  );
  const defaultCountryCode = affiliateCodes.filter(
    (aff) => aff.countryCode === DEFAULT_COUNTRY_CODE,
  );

  const code = _.find(affiliateCodes, (aff) => aff.type === 'amazon' && aff.countryCode === countryCode);
  const host = AMAZON_LINKS_BY_COUNTRY[_.get(code, 'countryCode')];
  const productIdObj = _.find(mappedProductIds, (id) => id.productIdType === host);
  if (productIdObj) {
    const link = specialAmazonLink({
      productIdObj, defaultCountryCode, requestCountryCode, mappedProductIds, countryCode,
    });
    if (link) links.set(AFFILIATE_TYPE.AMAZON, link);
  }
  for (const mappedProductId of mappedProductIds) {
    const { productId, productIdType } = mappedProductId;
    if (AMAZON_PRODUCT_IDS.includes(productIdType.toLocaleLowerCase())
      && !links.has(AFFILIATE_TYPE.AMAZON)) {
      const link = formAmazonLink({
        affiliateCodes,
        productId,
        productIdType,
        countryCode,
      });
      if (link) links.set(AFFILIATE_TYPE.AMAZON, link);
    }
    if (WALMART_PRODUCT_IDS.includes(productIdType.toLocaleLowerCase())
      && !links.has(AFFILIATE_TYPE.WALMART)) {
      const link = formWalmartLink({ productId });
      if (link) links.set(AFFILIATE_TYPE.WALMART, link);
    }
    if (TARGET_PRODUCT_IDS.includes(productIdType.toLocaleLowerCase())
      && !links.has(AFFILIATE_TYPE.TARGET)) {
      const link = formTargetLink({ productId });
      if (link) links.set(AFFILIATE_TYPE.TARGET, link);
    }
  }

  return [...links.values()];
};

const getAppAffiliateCodes = async ({ app, countryCode }) => {
  if (!app) return [];
  const { result } = await AppAffiliateModel.find(
    {
      filter: {
        host: app.host || config.appHost,
        // countryCode: { $in: [countryCode, DEFAULT_COUNTRY_CODE] },
      },
    },
  );

  return result;
};

module.exports = {
  formAffiliateLinks,
  getAppAffiliateCodes,
};
