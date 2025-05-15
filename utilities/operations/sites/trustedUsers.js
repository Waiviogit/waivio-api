const _ = require('lodash');
const {
  App, User,
} = require('../../../models');

const getTrusted = async ({
  trusted, trustedUsersMap = {}, depth = 0, maxDepth = 10, initialTrusted = [],
}) => {
  // trusted is now array of { name, guideName }
  const trustedUsers = _.uniqBy(trusted, 'name'); // Remove duplicates by name
  const trustedUserOwners = trustedUsers.filter((userObj) => !trustedUsersMap[userObj.name]);

  if (trustedUserOwners.length === 0) return Object.values(trustedUsersMap);

  trustedUserOwners.forEach((userObj) => {
    // Always use the guideName from the object
    trustedUsersMap[userObj.name] = { name: userObj.name, guideName: userObj.guideName };
  });

  if (depth >= maxDepth) return Object.values(trustedUsersMap);

  // Fetch all apps owned by trusted users in a single query
  const { result: apps } = await App.find(
    { owner: { $in: trustedUserOwners.map((u) => u.name) } },
    {},
    { trusted: 1, owner: 1 },
  );

  if (!apps?.length) return Object.values(trustedUsersMap);

  // Collect all nested trusted users as { name, guideName }
  const nestedTrustedUsers = [];
  apps.forEach((app) => {
    if (app.trusted && app.trusted.length) {
      nestedTrustedUsers.push(...app.trusted.map((name) => ({ name, guideName: app.owner })));
    }
  });

  if (nestedTrustedUsers.length > 0) {
    await getTrusted({
      trusted: nestedTrustedUsers,
      trustedUsersMap,
      depth: depth + 1,
      maxDepth,
      initialTrusted: depth === 0 ? trustedUsers.map((u) => u.name) : initialTrusted,
    });
  }

  return Object.values(trustedUsersMap);
};

const getTrustedUsers = async ({ host, owner }) => {
  const { result: app } = await App.findOne({ host, owner }, { trusted: 1, owner: 1 });
  if (!app) return { error: { status: 401 } };

  // Pass trusted as array of { name, guideName }
  const trusted = await getTrusted({
    trusted: (app?.trusted || []).map((name) => ({ name, guideName: app.owner })),
  });

  const { usersData } = await User.find({
    condition: { name: { $in: trusted.map((el) => el.name) } },
    select: { json_metadata: 1, name: 1, wobjects_weight: 1 },
    limit: 1000,
  });

  const mappedData = usersData.map((v) => {
    const userGuide = trusted.find((el) => el.name === v.name);
    if (!userGuide) return v;
    if (userGuide.guideName === app.owner) return v;
    return {
      ...v,
      guideName: userGuide.guideName,
    };
  });

  const result = _.orderBy(mappedData, [
    (user) => !user.guideName, // true values (no guideName) come first
    'guideName',
    'name',
  ], ['desc', 'asc', 'asc']);

  return { result };
};

module.exports = { getTrustedUsers, getTrusted };
