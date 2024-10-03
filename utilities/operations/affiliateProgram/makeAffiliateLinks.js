const _ = require('lodash');
const jsonHelper = require('utilities/helpers/jsonHelper');
const BigNumber = require('bignumber.js');
const { AFFILIATE_NULL_TYPES } = require('../../../constants/wobjectsData');
const {
  COUNTRY_TO_CONTINENT,
  GLOBAL_GEOGRAPHY,
} = require('../../../constants/affiliateData');

const getAffiliateCode = (codesArr) => {
  if (!Array.isArray(codesArr) || codesArr.length < 2) return '';

  if (codesArr.length === 2) return codesArr[1];

  const items = codesArr.slice(1).map((el) => {
    const [value, chance] = el.split('::');
    const parsedChance = Number(chance);

    // Mark as invalid if chance is not a valid number or negative
    if (isNaN(parsedChance) || parsedChance < 0) return null;
    return { value, chance: parsedChance };
  });

  // Check for invalid entries and return empty string if any
  if (items.includes(null)) return '';

  // Calculate total sum of chances
  const totalChance = items.reduce((acc, item) => acc + item.chance, 0);

  if (totalChance === 0) return ''; // Return empty string if total chance sum is zero

  // Normalize the chances if they do not sum up to 100
  if (totalChance !== 100) {
    items.forEach((item) => {
      item.chance = (item.chance / totalChance) * 100;
    });
  }

  // Create an array of cumulative chances
  const cumulativeChances = [];
  let sum = 0;

  for (let i = 0; i < items.length; i++) {
    sum += items[i].chance;
    cumulativeChances[i] = sum;
  }

  // Generate a random number between 0 and 100
  const randomNumber = BigNumber(Math.random()).times(100);

  // Find the item that corresponds to the random number
  for (let i = 0; i < cumulativeChances.length; i++) {
    if (randomNumber.lt(cumulativeChances[i])) return items[i].value;
  }

  // Fallback return in case something goes wrong
  return '';
};

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
    const affiliateCode = getAffiliateCode(affiliate.affiliateCode);
    if (!affiliateCode) return acc;

    const link = affiliate.affiliateUrlTemplate
      .replace('$productId', el.productId)
      .replace('$affiliateCode', affiliateCode);

    acc.push({
      link,
      image: affiliate.affiliateButton,
      affiliateCode,
      type: el.productIdType,
    });
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
    const affiliateCode = getAffiliateCode(affiliate.affiliateCode);
    if (!affiliateCode) return acc;

    const link = affiliate.affiliateUrlTemplate
      .replace('$productId', el.productId)
      .replace('$affiliateCode', affiliateCode);

    acc.push({
      link,
      image: affiliate.affiliateButton,
      affiliateCode,
      type: el.productIdType,
    });
    return acc;
  }, []);

  links.push(...createdLinks);
  return links;
};

module.exports = makeAffiliateLinks;
