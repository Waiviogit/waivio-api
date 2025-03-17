const { App, AppAffiliate } = require('../../../models');
const { ERROR_OBJ } = require('../../../constants/common');
const { AMAZON_LINKS_BY_COUNTRY } = require('../../../constants/wobjectsData');

const AFFILIATE_COUNTRY_TYPES = [
  ...Object.keys(AMAZON_LINKS_BY_COUNTRY).map((c) => ({ countryCode: c, type: 'amazon' })),
];

const checkOwnership = async ({ userName = '', host = '' }) => {
  const { result, error } = await App.findOne({ host, owner: userName }, { _id: 1 });
  if (error) return false;
  return !!result;
};

const getAffiliateSites = async ({ userName, host }) => {
  const owner = await checkOwnership({ userName, host });
  if (!owner) return { error: ERROR_OBJ.FORBIDDEN };

  const links = [];
  const { result } = await AppAffiliate.find({ filter: { host } });
  for (const affiliate of AFFILIATE_COUNTRY_TYPES) {
    const dbRecord = result.find(
      (r) => r.countryCode === affiliate.countryCode && r.type === affiliate.type,
    )
      ?? {
        affiliateCode: '', countryCode: affiliate.countryCode, type: affiliate.type, host,
      };

    links.push(dbRecord);
  }
  return { result: { links } };
};

const updateAffiliateSites = async ({ userName, host, links = [] }) => {
  const owner = await checkOwnership({ userName, host });
  if (!owner) return { error: ERROR_OBJ.FORBIDDEN };

  for (const link of links) {
    await AppAffiliate.updateOne({
      filter: { host, countryCode: link.countryCode, type: link.type },
      update: { $set: { affiliateCode: link.affiliateCode } },
      options: {
        upsert: true,
      },
    });
  }
  return { result: { updated: true } };
};

module.exports = {
  getAffiliateSites,
  updateAffiliateSites,
};
