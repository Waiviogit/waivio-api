const _ = require('lodash');
const {
  App, User,
} = require('../../../models');

const getTrusted = async ({
  trusted, trustedUsersMap = {}, depth = 0, maxDepth = 10, initialTrusted = [],
}) => {
  // Process all trusted users in parallel
  const trustedUsers = [...new Set(trusted)]; // Remove duplicates
  const trustedUserOwners = trustedUsers.filter((user) => !trustedUsersMap[user]);

  // If no new users to process, return the current map values
  if (trustedUserOwners.length === 0) return Object.values(trustedUsersMap);

  // Mark these users as processed
  trustedUserOwners.forEach((user) => {
    // For initial trusted users, set guideName to themselves
    // For other users, set guideName to the first initial trusted user
    const guideName = depth === 0 ? user : (initialTrusted[0] || user);
    trustedUsersMap[user] = { name: user, guideName };
  });

  // If we've reached maxDepth, return current results
  if (depth >= maxDepth) return Object.values(trustedUsersMap);

  // Fetch all apps owned by trusted users in a single query
  const { result: apps } = await App.find(
    { owner: { $in: trustedUserOwners } },
    {},
    { trusted: 1, owner: 1 },
  );

  if (!apps?.length) return Object.values(trustedUsersMap);

  // Collect all nested trusted users
  const nestedTrustedUsers = [];
  apps.forEach((app) => {
    if (app.trusted && app.trusted.length) {
      nestedTrustedUsers.push(...app.trusted);
    }
  });

  // Recursively process nested trusted users
  if (nestedTrustedUsers.length > 0) {
    await getTrusted({
      trusted: nestedTrustedUsers,
      trustedUsersMap,
      depth: depth + 1,
      maxDepth,
      initialTrusted: depth === 0 ? trustedUsers : initialTrusted,
    });
  }

  return Object.values(trustedUsersMap);
};

const getTrustedUsers = async ({ host, owner }) => {
  const { result: app } = await App.findOne({ host, owner }, { trusted: 1, owner: 1 });
  if (!app) return { error: { status: 401 } };

  const trusted = await getTrusted({
    trusted: app?.trusted || [],
  });

  const { usersData } = await User.find({
    condition: { name: { $in: trusted.map((el) => el.name) } },
    select: { json_metadata: 1, name: 1, wobjects_weight: 1 },
    limit: 1000,
  });

  const mappedData = usersData.map((v) => {
    const userGuide = trusted.find((el) => el.name === v.name);
    if (!userGuide) return v;
    if (userGuide.guideName === v.name) return v;
    return {
      ...v,
      guideName: userGuide.guideName,
    };
  });

  const result = _.orderBy(mappedData, ['guideName', 'name'], ['asc', 'asc']);

  return { result };
};

module.exports = { getTrustedUsers, getTrusted };
