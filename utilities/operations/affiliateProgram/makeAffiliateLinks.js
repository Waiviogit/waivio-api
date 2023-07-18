const _ = require('lodash');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { AFFILIATE_NULL_TYPES } = require('../../../constants/wobjectsData');

const makeFromExactMatched = ({
  affiliateCodes,
  mappedProductIds,
}) => {
  const usedAffiliate = [];

  const links = mappedProductIds.reduce((acc, el) => {
    const affiliate = affiliateCodes
      .find((a) => a.affiliateUrlTemplate.includes(el.productIdType));
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

const makeAffiliateLinks = ({ productIds = [], affiliateCodes = [] }) => {
  const usedAffiliate = [];
  const mappedProductIds = _.compact(_.map(productIds, (el) => {
    const body = jsonHelper.parseJson(el.body, {});
    if (!body?.productIdType) return;
    return {
      productId: body.productId,
      productIdType: body.productIdType,
    };
  }));

  const exactMatched = affiliateCodes.filter(
    (el) => mappedProductIds
      .some((p) => el.affiliateUrlTemplate.includes(p.productIdType)
        && !AFFILIATE_NULL_TYPES.includes(p.productId)),
  );

  if (exactMatched.length) {
    const ids = mappedProductIds
      .filter((el) => exactMatched
        .some((aff) => aff.affiliateUrlTemplate.includes(el.productIdType)
          && !AFFILIATE_NULL_TYPES.includes(el.productId)));

    return makeFromExactMatched({
      affiliateCodes: exactMatched,
      mappedProductIds: ids,
    });
  }

  const nullAffiliate = affiliateCodes.filter(
    (el) => mappedProductIds
      .some((p) => el.affiliateUrlTemplate.includes(p.productIdType)
        && AFFILIATE_NULL_TYPES.includes(p.productId)),
  );
  if (nullAffiliate) {
    affiliateCodes = affiliateCodes
      .filter((aff) => !nullAffiliate.some(
        (nullAff) => _.isEqual(nullAff, aff),
      ));
  }

  const links = mappedProductIds.reduce((acc, el) => {
    const affiliate = affiliateCodes
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
