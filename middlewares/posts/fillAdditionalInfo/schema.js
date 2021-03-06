exports.schema = [
  // wobject controller
  {
    path: '/wobject/:authorPermlink/posts',
    method: 'POST',
    case: 1,
  },
  {
    path: '/wobjectsFeed',
    method: 'POST',
    case: 1,
  },
  // user controller
  {
    path: '/user/:userName/feed',
    method: 'POST',
    case: 1,
  },
  {
    path: '/user/:userName/blog',
    method: 'POST',
    case: 3,
  },
  // post controller
  {
    path: '/posts',
    method: 'POST',
    case: 1,
  },
  {
    path: '/post/:author/:permlink',
    method: 'GET',
    case: 2,
  },
  {
    path: '/posts/getMany',
    method: 'POST',
    case: 1,
  },
];
