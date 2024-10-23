const SITE_OBJECT_PREFIX = 'xsw_';

const getCollectionName = ({ prefix = SITE_OBJECT_PREFIX, host }) => {
  const cleanedHostName = host.replace(/\./g, '_');

  return `${prefix}${cleanedHostName}`;
};

module.exports = {
  getCollectionName,
};
