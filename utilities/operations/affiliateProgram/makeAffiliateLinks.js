const _ = require('lodash');
const jsonHelper = require('utilities/helpers/jsonHelper');

const makeAffiliateLinks = ({ productIds, affiliateLinks }) => {
  const usedAffiliate = [];
  const mappedProductIds = _.compact(_.map(productIds, (el) => {
    const body = jsonHelper.parseJson(el.body, {});
    if (!body?.productIdType) return;
    return {
      productId: body.productId,
      productIdType: body.productIdType,
    };
  }));

  const links = mappedProductIds.reduce((acc, el) => {
    const affiliate = affiliateLinks
      .find((a) => a.affiliateProductIdTypes.includes(el.productIdType));
    if (!affiliate) return acc;
    if (usedAffiliate.some((used) => _.isEqual(used, affiliate))) return acc;
    usedAffiliate.push(affiliate);
    const link = affiliate.affiliateUrlTemplate
      .replace('$productId', el.productId)
      .replace('$affiliateCode', affiliate.affiliateCode[1]);

    acc.push({ link, image: affiliate.affiliateButton });
    return acc;
  }, []);

  return links;
};

module.exports = makeAffiliateLinks;
