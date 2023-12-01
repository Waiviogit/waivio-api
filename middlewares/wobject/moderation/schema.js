exports.schema = [
  // wobject controller
  {
    path: '/wobject',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  // {
  //   path: '/wobject/:authorPermlink',
  //   method: 'GET',
  //   case: 1,
  // },
  {
    path: '/sites/map',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink/posts',
    method: 'POST',
    case: 4,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink/pin',
    method: 'POST',
    case: 4,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjectsFeed',
    method: 'POST',
    case: 4,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjectSearch',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/search-default',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink/nearby',
    method: 'GET',
    case: 2,
  },
  {
    path: '/wobjects/map/last-post',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/campaign/required-object',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/options',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/group-id',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  // user controller
  {
    path: '/user/:userName/following_objects',
    method: 'POST',
    case: 2,
  },
  // {
  //   path: '/user/:userName/feed',
  //   method: 'POST',
  //   case: 4,
  //   wobjects_path: 'wobjects',
  // },
  {
    path: '/user/:userName/blog',
    method: 'POST',
    case: 7,
    wobjects_path: 'wobjects',
    array_path: 'posts',
  },
  {
    path: '/user/:userName/objects_shares',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/user/:userName/following_updates',
    method: 'GET',
    case: 7,
    wobjects_path: 'related_wobjects',
    array_path: 'wobjects_updates',
  },
  // general search
  {
    path: '/generalSearch',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  // post controller
  {
    path: '/post/:author/:permlink',
    method: 'GET',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/post/like-post',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
  // {
  //   path: '/posts',
  //   method: 'POST',
  //   case: 4,
  //   wobjects_path: 'wobjects',
  // },
  {
    path: '/posts/getMany',
    method: 'POST',
    case: 4,
    wobjects_path: 'wobjects',
  },
  // object_type controller
  {
    path: '/objectTypes',
    method: 'POST',
    case: 4,
    wobjects_path: 'related_wobjects',
  },
  {
    path: '/objectType/:objectTypeName',
    method: 'POST',
    case: 6,
    wobjects_path: 'related_wobjects',
  },
  // app controller
  {
    path: '/app/:name/hashtags',
    method: 'GET',
    case: 6,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink/child_wobjects',
    method: 'GET',
    case: 2,
    wobjects_path: 'wobjects',
  },
  {
    path: '/departments/wobjects',
    method: 'POST',
    case: 6,
    wobjects_path: 'wobjects',
  },
];
