const getShopDepartments = require('./mainShop/getShopDepartments');
const getUserDepartments = require('./userShop/getUserDepartments');
const getWobjectDepartments = require('./objectShop/getWobjectDepartments');

const restoreShopState = async ({
  path,
  authorPermlink,
  userName,
  type,
  app,
}) => {
  let subdirectory = false;
  if (!path.length) {
    return {
      result: {
        subdirectory,
        excludedDepartments: [],
      },
    };
  }
  const handler = {
    main: getShopDepartments,
    user: getUserDepartments.getTopDepartments,
    object: getWobjectDepartments,
  };

  const { result: firstLvl } = await handler[type]({
    app, authorPermlink, userName,
  });

  const excluded = firstLvl.map((el) => el.name);

  for (const department of path) {
    const { result: nextLvl } = await handler[type]({
      app, authorPermlink, userName, name: department, excluded, path,
    });
    excluded.push(...nextLvl.map((el) => el.name));
    subdirectory = !!nextLvl.length;
  }

  return {
    result: {
      subdirectory,
      excludedDepartments: excluded,
    },
  };
};

module.exports = restoreShopState;
