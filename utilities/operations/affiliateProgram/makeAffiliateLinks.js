const _ = require('lodash');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { AFFILIATE_NULL_TYPES } = require('../../../constants/wobjectsData');
const {
  COUNTRY_TO_CONTINENT,
  GLOBAL_GEOGRAPHY,
} = require('../../../constants/affiliateData');

const makeFromExactMatched = ({
  affiliateCodes,
  mappedProductIds,
}) => {
  const usedAffiliate = [];

  const links = mappedProductIds.reduce((acc, el) => {
    const affiliate = affiliateCodes
      .find((a) => a.affiliateUrlTemplate.includes(el.productIdType.toLocaleLowerCase()));
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

const chooseOneFromSimilar = ({ similar, countryCode }) => {
  const continent = COUNTRY_TO_CONTINENT[countryCode];

  const country = similar.find((el) => el.affiliateGeoArea.includes(countryCode));
  const continentObj = similar.find((el) => el.affiliateGeoArea.includes(continent));
  const global = similar.find((el) => el.affiliateGeoArea.includes(GLOBAL_GEOGRAPHY));

  return country || continentObj || global;
};

const filterByIdType = ({ affiliateCodes, countryCode }) => {
  const filtered = [];
  const alreadyUsed = [];

  for (const object of affiliateCodes) {
    if (alreadyUsed.some((el) => _.isEqual(el, object))) continue;
    const similar = affiliateCodes.filter(
      (el) => el.affiliateProductIdTypes.some((t) => object.affiliateProductIdTypes.includes(t)),
    );
    const filteredEl = chooseOneFromSimilar({ similar, countryCode });

    if (!filteredEl) continue;
    filtered.push(filteredEl);
    alreadyUsed.push(...similar);
  }

  return filtered;
};

const makeAffiliateLinks = ({ productIds = [], affiliateCodes = [], countryCode }) => {
  const links = [];
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

    const exec = makeFromExactMatched({
      affiliateCodes: exactMatched,
      mappedProductIds: ids,
    });
    links.push(...exec);
    usedAffiliate.push(...exactMatched);
  }

  const nullAffiliate = affiliateCodes.filter(
    (el) => mappedProductIds
      .some((p) => el.affiliateUrlTemplate.includes(p.productIdType)
        && AFFILIATE_NULL_TYPES.includes(p.productId)),
  );
  if (nullAffiliate.length) {
    affiliateCodes = affiliateCodes
      .filter((aff) => !nullAffiliate.some(
        (nullAff) => _.isEqual(nullAff, aff),
      ));
  }

  affiliateCodes = filterByIdType({ affiliateCodes, countryCode });

  const createdLinks = mappedProductIds.reduce((acc, el) => {
    const affiliate = affiliateCodes
      .find((a) => a.affiliateProductIdTypes.includes(el.productIdType.toLocaleLowerCase()));
    if (!affiliate) return acc;
    if (usedAffiliate.some((used) => _.isEqual(used, affiliate))) return acc;
    usedAffiliate.push(affiliate);
    const link = affiliate.affiliateUrlTemplate
      .replace('$productId', el.productId)
      .replace('$affiliateCode', affiliate.affiliateCode[1]);

    acc.push({ link, image: affiliate.affiliateButton, affiliateCode: affiliate.affiliateCode[1] });
    return acc;
  }, []);

  links.push(...createdLinks);
  return links;
};

module.exports = makeAffiliateLinks;
