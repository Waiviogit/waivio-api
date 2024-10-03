exports.schema = [{
  path: '/user/:userName/objects_shares',
  method: 'POST',
  case: 'case2',
  field_name: 'author_permlink',
  fields_path: 'wobjects',
}, {
  path: '/user/:userName/following_objects',
  method: 'POST',
  case: 'case1',
  field_name: 'author_permlink',
}, {
  path: '/wobject/:authorPermlink',
  method: 'GET',
  case: 'case3',
  field_name: 'author_permlink',
}, {
  path: '/wobject',
  method: 'POST',
  case: 'case2',
  field_name: 'author_permlink',
  fields_path: 'wobjects',
},
];
