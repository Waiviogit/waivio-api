exports.schema = [
  // wobject controller
  {
    path: '/wobject',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/sites/map',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink/posts',
    method: 'POST',
    case: 'case3',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink/pin',
    method: 'GET',
    case: 'case3',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjectsFeed',
    method: 'POST',
    case: 'case3',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjectSearch',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/search-area',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/search-default',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink/nearby',
    method: 'GET',
    case: 'case2',
  },
  {
    path: '/wobjects/campaign/required-object',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/options',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/group-id',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjects/active-campaigns',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  // user controller
  {
    path: '/user/:userName/following_objects',
    method: 'POST',
    case: 'case2',
  },
  {
    path: '/user/:userName/blog',
    method: 'POST',
    case: 'case5',
    wobjects_path: 'wobjects',
    array_path: 'posts',
  },
  {
    path: '/user/:userName/objects_shares',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/user/:userName/following_updates',
    method: 'GET',
    case: 'case5',
    wobjects_path: 'related_wobjects',
    array_path: 'wobjects_updates',
  },
  // general search
  {
    path: '/generalSearch',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  // post controller
  {
    path: '/post/:author/:permlink',
    method: 'GET',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/post/like-post',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/posts/getMany',
    method: 'POST',
    case: 'case3',
    wobjects_path: 'wobjects',
  },
  {
    path: '/posts/mentions',
    method: 'POST',
    case: 'case5',
    wobjects_path: 'wobjects',
    array_path: 'posts',
  },
  // object_type controller
  {
    path: '/objectTypes',
    method: 'POST',
    case: 'case3',
    wobjects_path: 'related_wobjects',
  },
  {
    path: '/objectType/:objectTypeName',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'related_wobjects',
  },
  // app controller
  {
    path: '/app/:name/hashtags',
    method: 'GET',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink/child_wobjects',
    method: 'GET',
    case: 'case2',
    wobjects_path: 'wobjects',
  },
  {
    path: '/departments/wobjects',
    method: 'POST',
    case: 'case4',
    wobjects_path: 'wobjects',
  },
];
