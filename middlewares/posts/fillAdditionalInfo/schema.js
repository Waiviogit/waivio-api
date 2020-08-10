exports.schema = [
  // wobject controller
  {
    path: '/wobject/:authorPermlink/posts',
    method: 'POST',
  },
  {
    path: '/wobjectsFeed',
    method: 'POST',
  },
  // user controller
  {
    path: '/user/:userName/feed',
    method: 'POST',
  },
  {
    path: '/user/:userName/blog',
    method: 'POST',
  },
  // post controller
  {
    path: '/posts',
    method: 'POST',
  },
  {
    path: '/post/:author/:permlink',
    method: 'GET',
  },
  {
    path: '/posts/getMany',
    method: 'POST',
  },
];
