const { SHOP_SETTINGS_TYPE } = require('../../constants/sitesConstants');

const getAppAuthorities = (app) => {
  const userShop = app?.configuration?.shopSettings?.type === SHOP_SETTINGS_TYPE.USER;

  const authorities = [...app.authority];

  if (userShop) {
    authorities.push(app?.configuration?.shopSettings?.value);
    return authorities;
  }

  authorities.push(app.owner);

  return authorities;
};

const isInheritedApp = (app) => app?.inherited && !app?.canBeExtended;

module.exports = {
  getAppAuthorities,
  isInheritedApp,
};
