exports.FOLLOWERS_SORT = {
  WOBJECT_SUB: 'wobjectSubscription',
  FOLLOWING_PATH: 'followingPath',
  FOLLOWER_PATH: 'followerPath',
  USER_SUB: 'userSubscription',
  FOLLOWING: 'following',
  FOLLOWERS: 'followers',
  FOLLOWER: 'follower',
  ALPHABET: 'alphabet',
  RECENCY: 'recency',
  RANK: 'rank',
};

exports.EXPERTS_SORT = {
  FOLLOWERS: 'followers',
  ALPHABET: 'alphabet',
  RECENCY: 'recency',
  RANK: 'rank',
};

exports.VALID_FOLLOWERS_SORT = [
  this.FOLLOWERS_SORT.FOLLOWERS,
  this.FOLLOWERS_SORT.ALPHABET,
  this.FOLLOWERS_SORT.RECENCY,
  this.FOLLOWERS_SORT.RANK,
];

exports.VALID_EXPERTS_SORT = [
  this.EXPERTS_SORT.FOLLOWERS,
  this.EXPERTS_SORT.ALPHABET,
  this.EXPERTS_SORT.RECENCY,
  this.EXPERTS_SORT.RANK,
];

exports.SEARCH_SORT = {
  WEIGHT: 'weight',
  CREATED: 'createdAt',
};
