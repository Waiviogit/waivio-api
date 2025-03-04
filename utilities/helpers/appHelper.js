const { SHOP_SETTINGS_TYPE } = require('../../constants/sitesConstants');

const getAppAuthorities = (app) => {
  const userShop = app?.configuration?.shopSettings?.type === SHOP_SETTINGS_TYPE.USER;
  const authorities = [...app.authority];
  if (userShop) {
    const shopUser = app?.configuration?.shopSettings?.value;

    const sameAsOwner = shopUser === app.owner;
    const pushFalse = sameAsOwner && app.disableOwnerAuthority;

    if (!pushFalse) authorities.push(shopUser);

    return authorities;
  }
  if (!app.disableOwnerAuthority) authorities.push(app.owner);

  return authorities;
};

const isInheritedApp = (app) => app?.inherited && !app?.canBeExtended;

module.exports = {
  getAppAuthorities,
  isInheritedApp,
};
