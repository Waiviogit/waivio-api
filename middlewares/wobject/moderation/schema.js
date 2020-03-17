exports.schema = [
  // wobject controller
  {
    path: '/wobject',
    method: 'POST',
    case: 3,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobject/:authorPermlink',
    method: 'GET',
    case: 1,
    custom_fields_paths: ['preview_gallery', 'tagCategories'],
  },
  {
    path: '/wobject/:authorPermlink/posts',
    method: 'POST',
    case: 4,
    wobjects_path: 'wobjects',
  },
  {
    path: '/wobjectsFeed',
    method: 'POST',
    case: 4,
  },
  {
    path: '/wobjectSearch',
    method: 'POST',
    case: 2,
  },
  {
    path: '/wobject/:authorPermlink/fields',
    method: 'POST',
    case: 5,
  },
  {
    path: '/wobject/:authorPermlink/gallery',
    method: 'GET',
    case: 2,
    fields_path: 'items',
    author_permlink_path: 'wobject_id',
  },
  {
    path: '/wobject/:authorPermlink/list',
    method: 'POST',
    case: 2,
  },
  // user controller
  {
    path: '/user/:userName/following_objects',
    method: 'POST',
    case: 2,
  },
  {
    path: '/user/:userName/feed',
    method: 'POST',
    case: 4,
  },
  {
    path: '/user/:userName/objects_shares',
    method: 'POST',
    case: 3,
    wobjects_path: 'wobjects',
  },
  // general search
  {
    path: '/generalSearch',
    method: 'POST',
    case: 3,
    wobjects_path: 'wobjects',
  },
  // post controller
  {
    path: '/post/:author/:permlink',
    method: 'GET',
    case: 3,
    wobjects_path: 'wobjects',
  },
  {
    path: '/posts',
    method: 'POST',
    case: 4,
    wobjects_path: 'wobjects',
  },
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
    path: '/objectTypesSearch',
    method: 'POST',
    case: 4,
    wobjects_path: 'related_wobjects',
  },
  {
    path: '/objectType/:objectTypeName',
    method: 'POST',
    case: 3,
    wobjects_path: 'related_wobjects',
  },
  // app controller
  {
    path: '/app/:name/hashtags',
    method: 'GET',
    case: 3,
    wobjects_path: 'wobjects',
  },
];
