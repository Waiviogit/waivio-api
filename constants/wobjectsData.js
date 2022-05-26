exports.FIELDS_NAMES = {
  BODY: 'body',
  MAP: 'map',
  TAG_CATEGORY: 'tagCategory',
  CATEGORY_ITEM: 'categoryItem',
  AUTHORITY: 'authority',
  STATUS: 'status',
  NEWS_FILTER: 'newsFilter',
  RATING: 'rating',
  TAG_CLOUD: 'tagCloud',
  TITLE: 'title',
  DESCRIPTION: 'description',
  NAME: 'name',
  PARENT: 'parent',
  GALLERY_ALBUM: 'galleryAlbum',
  GALLERY_ITEM: 'galleryItem',
  AVATAR: 'avatar',
  WEBSITE: 'website',
  BACKGROUND: 'background',
  ADDRESS: 'address',
  LINK: 'link',
  TAG: 'tag',
  PHONE: 'phone',
  EMAIL: 'email',
  PRICE: 'price',
  BUTTON: 'button',
  WORK_TIME: 'workTime',
  CHART_ID: 'chartid',
  PAGE_CONTENT: 'pageContent',
  LIST_ITEM: 'listItem',
  MENU_ITEM: 'menuItem',
  SORT_CUSTOM: 'sortCustom',
  BLOG: 'blog',
  FORM: 'form',
  COMPANY_ID: 'companyId',
};

exports.OBJECT_TYPES = {
  HASHTAG: 'hashtag',
  LIST: 'list',
  PAGE: 'page',
  RESTAURANT: 'restaurant',
  DISH: 'dish',
  DRINK: 'drink',
  BUSINESS: 'business',
  PRODUCT: 'product',
  SERVICE: 'service',
  COMPANY: 'company',
  PERSON: 'person',
  PLACE: 'place',
  CRYPTO: 'crypto',
  HOTEL: 'hotel',
  INDICES: 'indices',
  STOCKS: 'stocks',
  CURRENCIES: 'currencies',
  COMMODITY: 'commodity',
  CAR: 'car',
  TEST: 'test',
  ORGANIZATION: 'organization',
  MOTEL: 'motel',
  RESORT: 'resort',
  BnB: 'b&b',
};

exports.ADMIN_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  OWNERSHIP: 'ownership',
  ADMINISTRATIVE: 'administrative',
};

exports.VOTE_STATUSES = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

exports.ARRAY_FIELDS = [
  this.FIELDS_NAMES.CATEGORY_ITEM,
  this.FIELDS_NAMES.LIST_ITEM,
  this.FIELDS_NAMES.TAG_CATEGORY,
  this.FIELDS_NAMES.GALLERY_ITEM,
  this.FIELDS_NAMES.GALLERY_ALBUM,
  this.FIELDS_NAMES.RATING,
  this.FIELDS_NAMES.BUTTON,
  this.FIELDS_NAMES.PHONE,
  this.FIELDS_NAMES.BLOG,
  this.FIELDS_NAMES.FORM,
  this.FIELDS_NAMES.NEWS_FILTER,
];

exports.REQUIREDFIELDS = [
  this.FIELDS_NAMES.NAME,
  this.FIELDS_NAMES.AVATAR,
  this.FIELDS_NAMES.WEBSITE,
  this.FIELDS_NAMES.TITLE,
  this.FIELDS_NAMES.BACKGROUND,
  this.FIELDS_NAMES.ADDRESS,
  this.FIELDS_NAMES.DESCRIPTION,
  this.FIELDS_NAMES.MAP,
  this.FIELDS_NAMES.LINK,
  this.FIELDS_NAMES.TAG,
  this.FIELDS_NAMES.PHONE,
  this.FIELDS_NAMES.EMAIL,
  this.FIELDS_NAMES.RATING,
  this.FIELDS_NAMES.PARENT,
  this.FIELDS_NAMES.TAG_CLOUD,
  this.FIELDS_NAMES.PRICE,
  this.FIELDS_NAMES.BUTTON,
  this.FIELDS_NAMES.WORK_TIME,
  this.FIELDS_NAMES.CHART_ID,
  this.FIELDS_NAMES.NEWS_FILTER,
  this.FIELDS_NAMES.PAGE_CONTENT,
  this.FIELDS_NAMES.STATUS,
  this.FIELDS_NAMES.TAG_CATEGORY,
  this.FIELDS_NAMES.CATEGORY_ITEM,
  this.FIELDS_NAMES.BLOG,
  this.FIELDS_NAMES.FORM,
];

exports.REQUIREDFIELDS_PARENT = [
  this.FIELDS_NAMES.NAME,
  this.FIELDS_NAMES.AVATAR,
  this.FIELDS_NAMES.MAP,
  this.FIELDS_NAMES.LIST_ITEM,
  this.FIELDS_NAMES.SORT_CUSTOM,
];

exports.REQUIREDFIELDS_SEARCH = [
  this.FIELDS_NAMES.NAME,
  this.FIELDS_NAMES.DESCRIPTION,
  this.FIELDS_NAMES.LIST_ITEM,
  this.FIELDS_NAMES.AVATAR,
  this.FIELDS_NAMES.RATING,
  this.FIELDS_NAMES.PARENT,
  this.FIELDS_NAMES.BLOG,
  this.FIELDS_NAMES.SORT_CUSTOM,
  this.FIELDS_NAMES.NEWS_FILTER,
  this.FIELDS_NAMES.TITLE,
];

exports.REQUIREDFIELDS_SIMPLIFIED = [
  this.FIELDS_NAMES.NAME,
  this.FIELDS_NAMES.AVATAR,
  this.FIELDS_NAMES.MAP,
  this.FIELDS_NAMES.PARENT,
];

exports.REQUIREDFIELDS_CHILD = [this.FIELDS_NAMES.NAME, this.FIELDS_NAMES.AVATAR];

exports.REQUIREDFIELDS_POST = [
  this.FIELDS_NAMES.NAME,
  this.FIELDS_NAMES.AVATAR,
  this.FIELDS_NAMES.TITLE,
  this.FIELDS_NAMES.LIST_ITEM,
  this.FIELDS_NAMES.PARENT,
  this.FIELDS_NAMES.RATING,
  this.FIELDS_NAMES.CATEGORY_ITEM,
  this.FIELDS_NAMES.TAG_CATEGORY,
  this.FIELDS_NAMES.PRICE,
  this.FIELDS_NAMES.ADDRESS,
  this.FIELDS_NAMES.DESCRIPTION,
];

exports.REQUIREDFILDS_WOBJ_LIST = [
  this.FIELDS_NAMES.NAME,
  this.FIELDS_NAMES.AVATAR,
  this.FIELDS_NAMES.TITLE,
  this.FIELDS_NAMES.PARENT,
  this.FIELDS_NAMES.RATING,
  this.FIELDS_NAMES.MAP,
  this.FIELDS_NAMES.DESCRIPTION,
  this.FIELDS_NAMES.PRICE,
  this.FIELDS_NAMES.CATEGORY_ITEM,
  this.FIELDS_NAMES.LIST_ITEM,
  this.FIELDS_NAMES.TAG_CATEGORY,
  this.FIELDS_NAMES.ADDRESS,
  this.FIELDS_NAMES.CHART_ID,
  this.FIELDS_NAMES.BLOG,
  this.FIELDS_NAMES.NEWS_FILTER,
  this.FIELDS_NAMES.SORT_CUSTOM,
];

exports.WOBJECT_LATEST_POSTS_COUNT = 30;
exports.OBJECT_TYPE_TOP_WOBJECTS_COUNT = 30;
exports.OBJECT_TYPE_TOP_EXPERTS_COUNT = 30;

exports.categorySwitcher = {
  galleryAlbum: this.FIELDS_NAMES.GALLERY_ITEM,
  galleryItem: this.FIELDS_NAMES.GALLERY_ITEM,
  tagCategory: this.FIELDS_NAMES.CATEGORY_ITEM,
};

exports.SPECIFIC_FIELDS_MAPPINGS = {
  tagCategory: [this.FIELDS_NAMES.TAG_CATEGORY, this.FIELDS_NAMES.CATEGORY_ITEM],
  galleryAlbum: [this.FIELDS_NAMES.GALLERY_ALBUM, this.FIELDS_NAMES.GALLERY_ITEM],
  categoryItem: [this.FIELDS_NAMES.TAG_CATEGORY, this.FIELDS_NAMES.CATEGORY_ITEM],
  avatar: [this.FIELDS_NAMES.AVATAR, this.FIELDS_NAMES.PARENT],
};

exports.MIN_PERCENT_TO_SHOW_UPGATE = 70;
exports.GALLERY_WOBJECT_ID = 'wobject_id';
exports.LOW_PRIORITY_STATUS_FLAGS = ['relisted', 'unavailable'];

exports.INDEPENDENT_FIELDS = [
  this.FIELDS_NAMES.STATUS,
  this.FIELDS_NAMES.MAP,
  this.FIELDS_NAMES.PARENT,
];

exports.TOP_WOBJ_USERS_KEY = 'topUsers';

exports.FIELDS_TO_PARSE = [
  this.FIELDS_NAMES.SORT_CUSTOM,
];

exports.SHARING_SOCIAL_FIELDS = [
  this.FIELDS_NAMES.NAME,
  this.FIELDS_NAMES.LINK,
  this.FIELDS_NAMES.ADDRESS,
  this.FIELDS_NAMES.TAG_CATEGORY,
  this.FIELDS_NAMES.CATEGORY_ITEM,
];

exports.PICK_FIELDS_ABOUT_OBJ = [
  'name', 'default_name', 'avatar', 'author_permlink', 'defaultShowLink', 'description', 'title',
];

exports.STATUSES = {
  RELISTED: 'relisted',
  UNAVAILABLE: 'unavailable',
  NSFW: 'nsfw',
  FLAGGED: 'flagged',
};

exports.REMOVE_OBJ_STATUSES = [
  this.STATUSES.NSFW,
  this.STATUSES.RELISTED,
  this.STATUSES.UNAVAILABLE,
];

exports.MAIN_OBJECT_TYPES = [
  this.OBJECT_TYPES.RESTAURANT,
  this.OBJECT_TYPES.DISH,
  this.OBJECT_TYPES.DRINK,
];
