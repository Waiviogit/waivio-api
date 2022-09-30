exports.schema = [
  // wobject controller
  {
    path: '/wobject/:authorPermlink/followers',
    method: 'POST',
    case: 2,
    fields_path: 'wobjectFollowers',
    field_name: 'name',
  },
  {
    path: '/wobject/:authorPermlink/object_expertise',
    method: 'POST',
    case: 2,
    fields_path: 'users',
    field_name: 'name',
  },
  {
    path: '/wobjects/map/experts',
    method: 'POST',
    case: 2,
    fields_path: 'users',
    field_name: 'name',
  },
  {
    path: '/wobject/:authorPermlink/posts',
    method: 'POST',
    case: 1,
    field_name: 'author',
  },
  // user controller
  {
    path: '/users',
    method: 'GET',
    case: 1,
    field_name: 'name',
  },
  {
    path: '/generalSearch',
    method: 'POST',
    case: 2,
    fields_path: 'users',
    field_name: 'account',
  },
  {
    path: '/users/search',
    method: 'GET',
    case: 2,
    fields_path: 'users',
    field_name: 'account',
  },
  {
    path: '/user/:userName/following_users',
    method: 'GET',
    case: 2,
    fields_path: 'users',
    field_name: 'name',
  },
  {
    path: '/user/:userName/followers',
    method: 'GET',
    case: 2,
    fields_path: 'followers',
    field_name: 'name',
  },
  {
    path: '/user/:userName',
    method: 'GET',
    case: 3,
    field_name: 'name',
  },
  {
    path: '/user/:userName/feed',
    method: 'POST',
    case: 1,
    field_name: 'author',
  },
  {
    path: '/user/:userName/blog',
    method: 'POST',
    case: 2,
    field_name: 'author',
    fields_path: 'posts',
  },
  {
    path: '/user/getUsersData',
    method: 'POST',
    case: 2,
    fields_path: 'users',
    field_name: 'name',
  },
  // post controller
  // {
  //   path: '/posts',
  //   method: 'POST',
  //   case: 1,
  //   field_name: 'author',
  // },
  {
    path: '/post/:author/:permlink',
    method: 'GET',
    case: 3,
    field_name: 'author',
  },
];
