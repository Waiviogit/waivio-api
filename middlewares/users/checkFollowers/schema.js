exports.schema = [
  {
    path: '/users',
    method: 'GET',
    case: 1,
  },
  {
    path: '/generalSearch',
    method: 'POST',
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
    path: '/wobject/:authorPermlink/followers',
    method: 'POST',
    case: 1,
    fields_path: 'followers',
    field_name: 'name',
  },
  {
    path: '/wobject/:authorPermlink/object_expertise',
    method: 'POST',
    case: 2,
    fields_path: 'users',
    field_name: 'name',
  },
];
