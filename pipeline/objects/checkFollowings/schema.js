exports.schema = [{
  path: '/user/:userName/objects_shares',
  method: 'POST',
  case: 2,
  field_name: 'author_permlink',
  fields_path: 'wobjects',
}, {
  path: '/user/:userName/following_objects',
  method: 'POST',
  case: 1,
  field_name: 'author_permlink',
}, {
  path: '/wobject/:authorPermlink',
  method: 'GET',
  case: 3,
  field_name: 'author_permlink',
}, {
  path: '/wobject',
  method: 'POST',
  case: 2,
  field_name: 'author_permlink',
  fields_path: 'wobjects',
},
];
