const { getLinksFromPosts } = require('./linksFromPosts');

(async () => {
  await getLinksFromPosts();
  process.exit();
})();
