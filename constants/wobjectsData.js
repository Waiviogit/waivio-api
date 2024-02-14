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
  PRODUCT_ID: 'productId',
  GROUP_ID: 'groupId',
  OPTIONS: 'options',
  AGE_RANGE: 'ageRange',
  PUBLICATION_DATE: 'publicationDate',
  LANGUAGE: 'language',
  WEIGHT: 'productWeight',
  DIMENSIONS: 'dimensions',
  AUTHORS: 'authors',
  PUBLISHER: 'publisher',
  PRINT_LENGTH: 'printLength',
  WIDGET: 'widget',
  NEWS_FEED: 'newsFeed',
  DEPARTMENTS: 'departments',
  MERCHANT: 'merchant',
  MANUFACTURER: 'manufacturer',
  BRAND: 'brand',
  FEATURES: 'features',
  PIN: 'pin',
  REMOVE: 'remove',
  SHOP_FILTER: 'shopFilter',
  RELATED: 'related',
  ADD_ON: 'addOn',
  SIMILAR: 'similar',
  AFFILIATE_BUTTON: 'affiliateButton',
  AFFILIATE_PRODUCT_ID_TYPES: 'affiliateProductIdTypes',
  AFFILIATE_GEO_AREA: 'affiliateGeoArea',
  AFFILIATE_URL_TEMPLATE: 'affiliateUrlTemplate',
  AFFILIATE_CODE: 'affiliateCode',
  WEB_PAGE: 'webpage',
};

exports.LIST_TYPES = {
  MENU_PAGE: 'menuPage',
  MENU_LIST: 'menuList',
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
  BOOK: 'book',
  WIDGET: 'widget',
  NEWS_FEED: 'newsfeed',
  SHOP: 'shop',
  AFFILIATE: 'affiliate',
  WEB_PAGE: 'webpage',
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

exports.FULL_SINGLE_FIELDS = [
  this.FIELDS_NAMES.NEWS_FEED,
];

exports.AFFILIATE_FIELDS = [
  this.FIELDS_NAMES.AFFILIATE_BUTTON,
  this.FIELDS_NAMES.AFFILIATE_PRODUCT_ID_TYPES,
  this.FIELDS_NAMES.AFFILIATE_GEO_AREA,
  this.FIELDS_NAMES.AFFILIATE_URL_TEMPLATE,
  this.FIELDS_NAMES.AFFILIATE_CODE,
  this.FIELDS_NAMES.AUTHORITY,
];

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
  this.FIELDS_NAMES.COMPANY_ID,
  this.FIELDS_NAMES.PRODUCT_ID,
  this.FIELDS_NAMES.OPTIONS,
  this.FIELDS_NAMES.AUTHORS,
  this.FIELDS_NAMES.DEPARTMENTS,
  this.FIELDS_NAMES.FEATURES,
  this.FIELDS_NAMES.AUTHORITY,
  this.FIELDS_NAMES.GROUP_ID,
  this.FIELDS_NAMES.PIN,
  this.FIELDS_NAMES.REMOVE,
  this.FIELDS_NAMES.MENU_ITEM,
  this.FIELDS_NAMES.RELATED,
  this.FIELDS_NAMES.ADD_ON,
  this.FIELDS_NAMES.SIMILAR,
  this.FIELDS_NAMES.AFFILIATE_GEO_AREA,
  this.FIELDS_NAMES.AFFILIATE_PRODUCT_ID_TYPES,
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
  this.FIELDS_NAMES.PRODUCT_ID,
  this.FIELDS_NAMES.AUTHORITY,
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
  this.FIELDS_NAMES.PRODUCT_ID,
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
  this.FIELDS_NAMES.PRODUCT_ID,
  this.FIELDS_NAMES.NEWS_FEED,
  this.FIELDS_NAMES.WEB_PAGE,
  this.FIELDS_NAMES.AUTHORITY,
  this.FIELDS_NAMES.GROUP_ID,
  this.FIELDS_NAMES.MENU_ITEM,
];

exports.DEFAULT_LINK_FIELDS = [
  this.FIELDS_NAMES.SORT_CUSTOM,
  this.FIELDS_NAMES.NEWS_FILTER,
  this.FIELDS_NAMES.LIST_ITEM,
  this.FIELDS_NAMES.BLOG,
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
  options: [this.FIELDS_NAMES.OPTIONS, this.FIELDS_NAMES.GROUP_ID],
};

exports.MIN_PERCENT_TO_SHOW_UPGATE = 70;
exports.GALLERY_WOBJECT_ID = 'wobject_id';
exports.LOW_PRIORITY_STATUS_FLAGS = ['relisted', 'unavailable'];

exports.INDEPENDENT_FIELDS = [
  this.FIELDS_NAMES.STATUS,
  this.FIELDS_NAMES.MAP,
  this.FIELDS_NAMES.PARENT,
  this.FIELDS_NAMES.AUTHORITY,
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
  'name', 'default_name', 'avatar', 'author_permlink', 'defaultShowLink', 'description', 'title', 'object_type',
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

exports.COUNTRY_CODES = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
  BR: 'Brazil',
  GB: 'United Kingdom',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  DE: 'Germany',
  NL: 'Netherlands',
  SE: 'Sweden',
  PL: 'Poland',
  IN: 'India',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  JP: 'Japan',
  AU: 'Australia',
};

exports.AMAZON_LINKS_BY_COUNTRY = {
  US: 'amazon.com',
  CA: 'amazon.ca',
  MX: 'amazon.com.mx',
  BR: 'amazon.com.br',
  GB: 'amazon.co.uk',
  FR: 'amazon.fr',
  IT: 'amazon.it',
  ES: 'amazon.es',
  DE: 'amazon.de',
  NL: 'amazon.nl',
  SE: 'amazon.se',
  PL: 'amazon.pl',
  IN: 'amazon.in',
  AE: 'amazon.ae',
  SA: 'amazon.sa',
  SG: 'amazon.sg',
  JP: 'amazon.co.jp',
  AU: 'amazon.com.au',
};

exports.AFFILIATE_TYPE = {
  WALMART: 'walmart',
  AMAZON: 'amazon',
  TARGET: 'target',
};

exports.DEFAULT_COUNTRY_CODE = 'US';

exports.AMAZON_PRODUCT_IDS = [
  'asin',
  'isbn-10',
  'asins',
  ...Object.values(this.AMAZON_LINKS_BY_COUNTRY),
];
exports.WALMART_PRODUCT_IDS = ['walmartNum', 'walmart'];
exports.TARGET_PRODUCT_IDS = ['target'];

exports.OBJECT_TYPES_FOR_GROUP_ID = [
  this.OBJECT_TYPES.PRODUCT,
  this.OBJECT_TYPES.SERVICE,
  this.OBJECT_TYPES.BOOK,
];

exports.SHOP_OBJECT_TYPES = [
  this.OBJECT_TYPES.BOOK,
  this.OBJECT_TYPES.PRODUCT,
];

exports.AFFILIATE_NULL_TYPES = ['none', 'null'];

exports.WHITE_LIST_KEY = 'white_list_import';

exports.VOTE_COST = {
  USUAL: 0.001,
  FOR_WHITE_LIST: 0.0001,
};

exports.FAVORITES_OBJECT_TYPES = [
  'list',
  'page',
  'business',
  'person',
  'newsfeed',
  'widget',
  'webpage',
  'shop',
  'affiliate',
  'restaurant',
  'dish',
  'drink',
  'service',
  'place',
  'company',
  'organization',
  'app',
  'crypto',
  'indices',
  'commodity',
  'currency',
  'stocks',
  'currencies',
  'hotel',
  'motel',
  'resort',
  'b&b',
  'car',
  'test',
];
