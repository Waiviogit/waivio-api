exports.schema = [
  {
    path: '/user/:userName',
    method: 'GET',
    case: 1,
    field_name: 'name',
  },
  {
    path: '/wobject/:authorPermlink',
    method: 'GET',
    case: 2,
    field_name: 'author_permlink',
  },
];
