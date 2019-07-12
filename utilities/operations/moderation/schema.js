exports.schema = [
    {
        path: '/wobject',
        method: 'POST',
        case: 2
    },
    {
        path: '/wobject/:authorPermlink',
        method: 'GET',
        case: 1
    },
    {
        path: '/wobject/:authorPermlink/posts',
        method: 'POST',
        case: 4,
        wobjects_path: 'wobjects'
    },
    {
        path: '/wobject/:authorPermlink/fields',
        method: 'POST',
        case: 5
    }
];
