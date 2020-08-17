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
};

exports.AUTHORITY_FIELD_ENUM = {
  ADMINISTRATIVE: 'administrative',
  OWNERSHIP: 'ownership',
};

exports.OBJECT_TYPES = {
  HASHTAG: 'hashtag',
  LIST: 'list',
};

exports.REQUIREDFIELDS = [
  'name',
  'title',
  'website',
  'avatar',
  'background',
  'address',
  'description',
  'map',
  'link',
  'tag',
  'phone',
  'email',
  'rating',
  'parent',
  'tagCloud',
  'price',
  'button',
  'workTime',
  'chartid',
  'newsFilter',
  'pageContent',
  'status',
];
exports.REQUIREDFIELDS_PARENT = ['name', 'avatar'];
exports.REQUIREDFIELDS_SEARCH = ['name', 'avatar', 'rating', 'parent'];
exports.REQUIREDFIELDS_CHILD = ['name', 'avatar'];
exports.REQUIREDFIELDS_POST = ['name', 'avatar', 'title', 'parent'];
exports.WOBJECT_LATEST_POSTS_COUNT = 30;
exports.OBJECT_TYPE_TOP_WOBJECTS_COUNT = 30;
exports.OBJECT_TYPE_TOP_EXPERTS_COUNT = 30;

exports.categorySwitcher = {
  galleryAlbum: 'galleryItem',
  tagCategory: 'categoryItem',
};

exports.SPECIFIC_FIELDS_MAPPINGS = {
  tagCategory: ['tagCategory', 'categoryItem'],
  galleryAlbum: ['galleryAlbum', 'galleryItem'],
  categoryItem: ['tagCategory', 'categoryItem'],
  avatar: ['avatar', 'parent'],
};

exports.ADMIN_ROLES = {
  ADMIN: 'admin',
  OWNERSHIP: 'ownership',
  ADMINISTRATIVE: 'administrative',
};

exports.MIN_PERCENT_TO_SHOW_UPGATE = 70;
exports.GALLERY_WOBJECT_ID = 'wobject_id';
exports.LOW_PRIORITY_STATUS_FLAGS = ['relisted', 'unavailable'];
