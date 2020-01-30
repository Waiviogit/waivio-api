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
    'status'
];
exports.REQUIREFIELDS_PARENT = [ 'name', 'avatar' ];
exports.REQUIREFIELDS_SEARCH = [ 'name', 'avatar', 'rating' ];
exports.REQUIREFIELDS_CHILD = [ 'name', 'avatar' ];
exports.LANGUAGES = [ 'en-US',
    'id-ID',
    'ms-MY',
    'ca-ES',
    'cs-CZ',
    'da-DK',
    'de-DE',
    'et-EE',
    'es-ES',
    'fil-PH',
    'fr-FR',
    'hr-HR',
    'it-IT',
    'hu-HU',
    'nl-HU',
    'no-NO',
    'pl-PL',
    'pt-BR',
    'ro-RO',
    'sl-SI',
    'sv-SE',
    'vi-VN',
    'tr-TR',
    'yo-NG',
    'el-GR',
    'bg-BG',
    'ru-RU',
    'uk-UA',
    'he-IL',
    'ar-SA',
    'ne-NP',
    'hi-IN',
    'as-IN',
    'bn-IN',
    'ta-IN',
    'lo-LA',
    'th-TH',
    'ko-KR',
    'ja-JP',
    'zh-CN',
    'auto'
];
exports.WOBJECT_LATEST_POSTS_COUNT = 30;
exports.OBJECT_TYPE_TOP_WOBJECTS_COUNT = 30;
exports.OBJECT_TYPE_TOP_EXPERTS_COUNT = 30;
exports.LOW_PRIORITY_STATUS_FLAGS = [ 'relisted', 'unavailable' ];
exports.DAYS_FOR_HOT_FEED = 3;
exports.DAYS_FOR_TRENDING_FEED = 7;
exports.MEDIAN_USER_WAIVIO_RATE = Number( process.env.MEDIAN_USER_WAIVIO_RATE ) || 25000; // some fixed average Waivio rate of user
exports.COMMENT_REF_TYPES = {
    postWithWobjects: 'post_with_wobj',
    createWobj: 'create_wobj',
    appendWobj: 'append_wobj',
    wobjType: 'wobj_type'
};
exports.MAX_IMPORTING_USERS = 20;
