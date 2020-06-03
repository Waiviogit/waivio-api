const fillEmptyAvatar = require('./fillEmptyAvatar');

/**
 * The task is written to add a default avatar for
 * guest users who are already created with empty avatars,
 * in the future, a default avatar will be added to all users
 */
(async () => {
  await fillEmptyAvatar();
  process.exit();
})();
