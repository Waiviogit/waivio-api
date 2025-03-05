const user = require('./user');
const wobject = require('./wobject');
const post = require('./post');

const TAGS = [
  {
    name: 'user',
    description: 'Info about waivio users',
  },
  {
    name: 'wobject',
    description: 'Info about waivio objects.\n A full description of possible keys with parameters can be found at \n https://github.com/Waiviogit/objects-bot/blob/master/docs/DetailsObjectFields.md',
  },
  {
    name: 'post',
    description: 'Posts of STEEM blockchain',
  },
  {
    name: 'object_type',
    description: 'Type of object',
  },
  {
    name: 'general-search',
    description: 'Search on users, objects, object types',
  },
  {
    name: 'image',
    description: 'Upload image to AWS cloud storage',
  },
  {
    name: 'app',
    description: 'Get some info about registered "Apps" on waivio',
  },
  {
    name: 'sites',
    description: 'Create and manage sites',
  },
  {
    name: 'vipTickets',
    description: 'Buy and manage vip tickets',
  },
  {
    name: 'hive',
    description: 'current median history price, reward fund etc.',
  },
  {
    name: 'hiveEngine',
    description: 'hiveEngine ops',
  },
  {
    name: 'departments',
    description: 'departments',
  },
  {
    name: 'shop',
    description: 'shop',
  },
  {
    name: 'draft',
    description: 'draft',
  },
  {
    name: 'thread',
    description: 'thread',
  },
  {
    name: 'admins',
    description: 'admins',
  },
];

module.exports = {
  swagger: '2.0',
  info: {
    description: 'API for all waivio apps\n[UI template for Waivio](https://waivio.com)\n',
    version: '1.0.0',
    title: 'Waivio API',
    termsOfService: 'https://hive.blog/@waivio',
    contact: {
      email: 'maxim@wizardsdev.com',
    },
  },
  host: 'localhost:3000',
  tags: TAGS,
  schemes: [
    'https',
    'http',
  ],
  paths: {
    ...user,
    ...wobject,
    ...post,
    '/api/admins': {
      get: {
        tags: ['admins'],
        description: 'get app admins',
        produces: ['application/json'],
        parameters: [
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/admins/sites': {
      get: {
        tags: ['admins'],
        description: 'get manage view',
        produces: ['application/json'],
        parameters: [
          {
            name: 'admin',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/managePage',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/admins/vip-tickets': {
      get: {
        tags: ['admins'],
        description: 'get vip tickets view',
        produces: ['application/json'],
        parameters: [
          {
            name: 'admin',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      userName: {
                        type: 'string',
                        example: 'john_doe',
                      },
                      purchased: {
                        type: 'number',
                        example: 500,
                      },
                      used: {
                        type: 'number',
                        example: 400,
                      },
                    },
                  },
                },
                totalPurchased: {
                  type: 'number',
                  example: 1000,
                },
                totalUsed: {
                  type: 'number',
                  example: 800,
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/admins/whitelist': {
      get: {
        tags: ['admins'],
        description: 'get whitelist view',
        produces: ['application/json'],
        parameters: [
          {
            name: 'admin',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                      alias: {
                        type: 'string',
                      },
                      wobjects_weight: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
      put: {
        tags: ['admins'],
        description: 'add user to whitelist',
        produces: ['application/json'],
        parameters: [
          {
            name: 'admin',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'number',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
      delete: {
        tags: ['admins'],
        description: 'delete user from whitelist',
        produces: ['application/json'],
        parameters: [
          {
            name: 'admin',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'number',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/admins/credits': {
      post: {
        tags: ['admins'],
        description: 'add credits amount to user',
        produces: ['application/json'],
        parameters: [
          {
            name: 'admin',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            required: true,
            type: 'string',
          },
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                amount: {
                  type: 'number',
                  minimum: 1,
                  maximum: 1000,
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'object',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/thread/hashtag': {
      get: {
        tags: ['thread'],
        description: 'get threads by hashtag',
        produces: ['application/json'],
        parameters: [
          {
            name: 'follower',
            in: 'header',
            required: false,
            type: 'string',
          },
          {
            name: 'skip',
            in: 'query',
            required: false,
            type: 'number',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            type: 'number',
          },
          {
            name: 'hashtag',
            in: 'query',
            required: true,
            type: 'string',
          },
          {
            name: 'sort',
            in: 'query',
            required: true,
            enum: ['latest', 'oldest'],
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/thread',
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/thread/hashtag/count': {
      get: {
        tags: ['thread'],
        description: 'get hashtag count',
        produces: ['application/json'],
        parameters: [
          {
            name: 'skip',
            in: 'query',
            required: false,
            type: 'number',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/hashtagCount',
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/thread/user': {
      get: {
        tags: ['thread'],
        description: 'get threads by user',
        produces: ['application/json'],
        parameters: [
          {
            name: 'follower',
            in: 'header',
            required: false,
            type: 'string',
          },
          {
            name: 'skip',
            in: 'query',
            required: false,
            type: 'number',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            type: 'number',
          },
          {
            name: 'user',
            in: 'query',
            required: true,
            type: 'string',
          },
          {
            name: 'sort',
            in: 'query',
            required: true,
            enum: ['latest', 'oldest'],
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/thread',
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/draft/post': {
      post: {
        tags: ['draft'],
        description: 'create/update draft',
        produces: ['application/json'],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            required: true,
            schema: {
              $ref: '#/definitions/postDraft',
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/postDraft',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
      get: {
        tags: ['draft'],
        description: 'get draft',
        produces: ['application/json'],
        parameters: [
          {
            name: 'author',
            in: 'query',
            required: true,
            type: 'string',
          },
          {
            name: 'draftId',
            in: 'query',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/postDraft',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
      delete: {
        tags: ['draft'],
        description: 'delete draft',
        produces: ['application/json'],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                ids: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                author: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                acknowledged: {
                  type: 'boolean',
                },
                deletedCount: {
                  type: 'number',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/draft/posts': {
      get: {
        tags: ['draft'],
        description: 'get draft',
        produces: ['application/json'],
        parameters: [
          {
            name: 'author',
            in: 'query',
            required: true,
            type: 'string',
          },
          {
            name: 'skip',
            in: 'query',
            required: false,
            type: 'number',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/postDraft',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/draft/object': {
      post: {
        tags: ['draft'],
        description: 'create/update draft',
        produces: ['application/json'],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'user',
            in: 'body',
            required: true,
            schema: {
              $ref: '#/definitions/objectDraft',
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/objectDraft',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
      get: {
        tags: ['draft'],
        description: 'get draft',
        produces: ['application/json'],
        parameters: [
          {
            name: 'user',
            in: 'query',
            required: true,
            type: 'string',
          },
          {
            name: 'authorPermlink',
            in: 'query',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/objectDraft',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/draft/comment': {
      post: {
        tags: ['draft'],
        description: 'create/update draft',
        produces: ['application/json'],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'user',
            in: 'body',
            required: true,
            schema: {
              $ref: '#/definitions/commentDraft',
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/commentDraft',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
      get: {
        tags: ['draft'],
        description: 'get draft',
        produces: ['application/json'],
        parameters: [
          {
            name: 'user',
            in: 'query',
            required: true,
            type: 'string',
          },
          {
            name: 'author',
            in: 'query',
            required: true,
            type: 'string',
          },
          {
            name: 'permlink',
            in: 'query',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/commentDraft',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/departments': {
      post: {
        tags: ['shop'],
        description: 'Get all departments',
        produces: ['application/json'],
        parameters: [{
          name: 'params',
          in: 'body',
          description: 'no params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              excluded: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              path: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/departments_response',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/department-feed': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get department feed',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'locale',
            in: 'header',
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                department: {
                  type: 'string',
                },
                userName: {
                  type: 'string',
                },
                filter: {
                  $ref: '#/definitions/shop_filter',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/shop_object_feed',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/main-feed': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get main feed',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'locale',
            in: 'header',
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                department: {
                  type: 'string',
                },
                excludedDepartments: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                filter: {
                  $ref: '#/definitions/shop_filter',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/shop_object_feed',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/filters': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get filters',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/shop_filter_resp',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/filters/tags': {
      post: {
        tags: [
          'shop',
        ],
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                tagCategory: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'succesfull operation',
            schema: {
              $ref: '#/definitions/tagCategory_response',
            },
          },
          422: {
            description: 'Unprocessible Entity',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/shop/user/departments': {
      post: {
        tags: ['shop'],
        description: 'Get all departments',
        produces: ['application/json'],
        parameters: [{
          name: 'params',
          in: 'body',
          description: 'no params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              userName: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              excluded: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              path: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              schema: {
                type: 'string',
                enum: ['shop', 'recipe'],
              },
            },
          },
        }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/departments_response',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/user/department-feed': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get department feed',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'locale',
            in: 'header',
            type: 'string',
          },
          {
            name: 'follower',
            in: 'header',
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                department: {
                  type: 'string',
                },
                userName: {
                  type: 'string',
                },
                filter: {
                  $ref: '#/definitions/shop_filter',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                schema: {
                  type: 'string',
                  enum: ['shop', 'recipe'],
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/shop_object_feed',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/user/main-feed': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get main feed',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'locale',
            in: 'header',
            type: 'string',
          },
          {
            name: 'follower',
            in: 'header',
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                department: {
                  type: 'string',
                },
                excludedDepartments: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                filter: {
                  $ref: '#/definitions/shop_filter',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
                schema: {
                  type: 'string',
                  enum: ['shop', 'recipe'],
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/shop_object_feed',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/user/filters': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get filters',
        produces: [
          'application/json',
        ],
        parameters: [{
          name: 'params',
          in: 'body',
          description: 'no params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              userName: {
                type: 'string',
              },
              path: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              schema: {
                type: 'string',
                enum: ['shop', 'recipe'],
              },
            },
          },
        }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/shop_filter_resp',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/user/filters/tags': {
      post: {
        tags: [
          'shop',
        ],
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                tagCategory: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                schema: {
                  type: 'string',
                  enum: ['shop', 'recipe'],
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'succesfull operation',
            schema: {
              $ref: '#/definitions/tagCategory_response',
            },
          },
          422: {
            description: 'Unprocessible Entity',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/shop/wobject/departments': {
      post: {
        tags: ['shop'],
        description: 'Get all departments',
        produces: ['application/json'],
        parameters: [{
          name: 'params',
          in: 'body',
          description: 'no params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              authorPermlink: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              excluded: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              path: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/departments_response',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/wobject/department-feed': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get department feed',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'locale',
            in: 'header',
            type: 'string',
          },
          {
            name: 'follower',
            in: 'header',
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                department: {
                  type: 'string',
                },
                authorPermlink: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                filter: {
                  $ref: '#/definitions/shop_filter',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/shop_object_feed',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/wobject/main-feed': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get main feed',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'locale',
            in: 'header',
            type: 'string',
          },
          {
            name: 'follower',
            in: 'header',
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
                department: {
                  type: 'string',
                },
                excludedDepartments: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
                filter: {
                  $ref: '#/definitions/shop_filter',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/shop_object_feed',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/wobject/filters': {
      post: {
        tags: [
          'shop',
        ],
        description: 'Get filters',
        produces: [
          'application/json',
        ],
        parameters: [{
          name: 'params',
          in: 'body',
          description: 'no params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              authorPermlink: {
                type: 'string',
              },
              path: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/shop_filter_resp',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/wobject/filters/tags': {
      post: {
        tags: [
          'shop',
        ],
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
                tagCategory: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'succesfull operation',
            schema: {
              $ref: '#/definitions/tagCategory_response',
            },
          },
          422: {
            description: 'Unprocessible Entity',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/shop/state': {
      post: {
        tags: [
          'shop',
        ],
        description: 'get shop state',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
                userName: {
                  type: 'string',
                },
                path: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                type: {
                  type: 'string',
                  enum: ['main', 'user', 'object'],
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                subdirectory: {
                  type: 'boolean',
                },
                excludedDepartments: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/shop/wobject/reference': {
      post: {
        tags: [
          'shop',
        ],
        summary: 'Return list of wobjects that have reference on requested',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'follower',
            in: 'header',
            description: 'Name of user to check for following in wobjects',
            required: false,
            type: 'string',
          },
          {
            name: 'locale',
            in: 'header',
            description: 'Users locale',
            required: false,
            type: 'string',
            default: 'en-US',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                product: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/wobjectonlist',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/shop/wobject/reference/type': {
      post: {
        tags: [
          'shop',
        ],
        summary: 'Return list of wobjects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'follower',
            in: 'header',
            description: 'Name of user to check for following in wobjects',
            required: false,
            type: 'string',
          },
          {
            name: 'locale',
            in: 'header',
            description: 'Users locale',
            required: false,
            type: 'string',
            default: 'en-US',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
                referenceObjectType: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/inline_response_200_12',
            },
          },
        },
      },
    },
    '/api/shop/wobject/similar': {
      post: {
        tags: [
          'shop',
        ],
        summary: 'Return list of wobjects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'follower',
            in: 'header',
            description: 'Name of user to check for following in wobjects',
            required: false,
            type: 'string',
          },
          {
            name: 'locale',
            in: 'header',
            description: 'Users locale',
            required: false,
            type: 'string',
            default: 'en-US',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/inline_response_200_12',
            },
          },
        },
      },
    },
    '/api/shop/wobject/related': {
      post: {
        tags: [
          'shop',
        ],
        summary: 'Return list of wobjects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'follower',
            in: 'header',
            description: 'Name of user to check for following in wobjects',
            required: false,
            type: 'string',
          },
          {
            name: 'locale',
            in: 'header',
            description: 'Users locale',
            required: false,
            type: 'string',
            default: 'en-US',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/inline_response_200_12',
            },
          },
        },
      },
    },
    '/api/shop/wobject/add-on': {
      post: {
        tags: [
          'shop',
        ],
        summary: 'Return list of wobjects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'follower',
            in: 'header',
            description: 'Name of user to check for following in wobjects',
            required: false,
            type: 'string',
          },
          {
            name: 'locale',
            in: 'header',
            description: 'Users locale',
            required: false,
            type: 'string',
            default: 'en-US',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/inline_response_200_12',
            },
          },
        },
      },
    },
    '/api/departments': {
      post: {
        tags: [
          'departments',
        ],
        description: 'Create record deposit/withdraw',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params- top level departments name from top to bottom, names - for objects, exclude - names in path ',
            required: true,
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
                names: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                excluded: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  subdirectory: {
                    type: 'boolean',
                  },
                  related: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/departments/search': {
      post: {
        tags: [
          'departments',
        ],
        description: 'Create record deposit/withdraw',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params- top level departments name from top to bottom, names - for objects, exclude - names in path ',
            required: true,
            schema: {
              type: 'object',
              properties: {
                searchString: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                    },
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/departments/wobjects': {
      post: {
        tags: [
          'departments',
        ],
        description: 'Create record deposit/withdraw',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'get wobjects by departments',
            required: true,
            schema: {
              type: 'object',
              properties: {
                departments: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                skip: {
                  type: 'number',
                  default: 0,
                },
                limit: {
                  type: 'number',
                  default: 10,
                },
                schema: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                wobjects: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/wobject',
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/hive-engine/deposit-withdraw': {
      post: {
        tags: [
          'hiveEngine',
        ],
        description: 'Create record deposit/withdraw',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'waivio-auth',
            in: 'header',
            description: 'send if it is guest',
            type: 'boolean',
          },
          {
            name: 'params',
            in: 'body',
            description: 'available types withdraw and deposit\n body is params and response from convert request\n if type withdraw - add key withdrawalAmount\n can be either address or account key',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                type: {
                  type: 'string',
                  enum: [
                    'deposit',
                    'withdraw',
                  ],
                },
                from_coin: {
                  type: 'string',
                },
                to_coin: {
                  type: 'string',
                },
                destination: {
                  type: 'string',
                },
                pair: {
                  type: 'string',
                },
                address: {
                  type: 'string',
                },
                account: {
                  type: 'string',
                },
                memo: {
                  type: 'string',
                },
                ex_rate: {
                  type: 'number',
                },
                withdrawalAmount: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/hive/reward-fund': {
      get: {
        tags: [
          'hive',
        ],
        description: 'Return cached get_reward_fund',
        produces: [
          'application/json',
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '0',
                },
                name: {
                  type: 'string',
                  example: 'post',
                },
                reward_balance: {
                  type: 'string',
                  example: '817612.161 HIVE',
                },
                recent_claims: {
                  type: 'string',
                  example: '519265763673530443',
                },
                last_update: {
                  type: 'string',
                  example: '2021-08-05T11:33:00',
                },
                content_constant: {
                  type: 'string',
                  example: '2000000000000',
                },
                percent_curation_rewards: {
                  type: 'string',
                  example: '5000',
                },
                percent_content_rewards: {
                  type: 'string',
                  example: '10000',
                },
                author_reward_curve: {
                  type: 'string',
                  example: 'linear',
                },
                curation_reward_curve: {
                  type: 'string',
                  example: 'linear',
                },
              },
            },
          },
        },
      },
    },
    '/api/hive/current-median-history': {
      get: {
        tags: [
          'hive',
        ],
        description: 'Return cached get_current_median_history_price',
        produces: [
          'application/json',
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                base: {
                  type: 'string',
                  example: '0.401 HBD',
                },
                quote: {
                  type: 'string',
                  example: '1.000 HIVE',
                },
              },
            },
          },
        },
      },
    },
    '/api/hive/block-num': {
      get: {
        tags: [
          'hive',
        ],
        description: 'Return last block num of chosen parser',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'key',
            in: 'query',
            description: 'parser key',
            required: true,
            type: 'string',
            enum: [
              'last_block_num',
              'last_vote_block_num',
              'campaign_last_block_num',
            ],
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                blockNum: {
                  type: 'number',
                  example: 56181880,
                },
              },
            },
          },
        },
      },
    },
    '/api/hive/global-properties': {
      get: {
        tags: [
          'hive',
        ],
        description: 'Return get_dynamic_global_properties',
        produces: [
          'application/json',
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
    '/api/vip-tickets': {
      get: {
        tags: [
          'vipTickets',
        ],
        description: 'Return list two lists: activeTickets & consumedTickets',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'name of hive user',
            required: true,
            type: 'string',
          },
          {
            name: 'activeSkip',
            in: 'query',
            description: 'skip active tickets list',
            required: false,
            type: 'number',
          },
          {
            name: 'consumedSkip',
            in: 'query',
            description: 'skip consumed tickets list',
            required: false,
            type: 'number',
          },
          {
            name: 'activeLimit',
            in: 'query',
            description: 'limit active tickets list',
            required: false,
            type: 'number',
          },
          {
            name: 'consumedLimit',
            in: 'query',
            description: 'limit consumed tickets list',
            required: false,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                price: {
                  type: 'number',
                },
                activeTickets: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/vipTicket',
                  },
                },
                consumedTickets: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/vipTicket',
                  },
                },
                hasMoreActive: {
                  type: 'boolean',
                },
                hasMoreConsumed: {
                  type: 'boolean',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Token not valid!',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
      patch: {
        tags: [
          'vipTickets',
        ],
        description: 'edit vipTicket note',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: '**userName** - name of authorised user\n**ticket** - vip ticket\n**note** - note',
            required: true,
            schema: {
              example: {
                userName: 'grampo',
                ticket: '4534-dfds-54345-45325-5434',
                note: 'my note',
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'response',
            schema: {
              $ref: '#/definitions/vipTicket',
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Token not valid!',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/sites': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get all user created sites',
        description: 'Return list user sites active, pending and deactivated(deactivated< 6 month ago)',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'name of hive user',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  host: {
                    type: 'string',
                  },
                  id: {
                    type: 'string',
                  },
                },
              },
              example: [
                {
                  host: 'van.dining.gifts',
                  id: '5f7ef6391b6f614fdae9249c',
                },
              ],
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Token not valid!',
              },
            },
          },
        },
      },
      post: {
        tags: [
          'sites',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
        ],
        summary: 'Get info about app for first load',
        description: 'Return configurations for first load app, get host from origin headers',
        produces: [
          'application/json',
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/firstLoad',
            },
          },
          404: {
            description: 'Not found',
            schema: {
              example: {
                message: 'App not found!',
              },
            },
          },
        },
      },
      delete: {
        tags: [
          'sites',
        ],
        summary: 'Delete one user website ',
        description: 'Delete user website, only websites with status PENDING can be deleted',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: '**userName** - name of user - who create website,\n **host** - website host',
            required: true,
            schema: {
              example: {
                userName: 'grampo',
                host: 'van.dining.pp.ua',
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              example: {
                result: {
                  id: 'c779b850f073f631c1f3aaf1ec5af44931dc074f',
                  block_num: 47590315,
                  trx_num: 8,
                  expired: false,
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Token not valid!',
              },
            },
          },
        },
      },
    },
    '/api/sites/info': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get site info',
        description: 'Return special fields from app',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'host',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              example: {
                status: 'active',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/create': {
      put: {
        tags: [
          'sites',
        ],
        summary: 'Create new site',
        description: 'Create new pending website',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: '**owner** - name of user - who create website\n, **name** - name of subdomain - allow only lowercase and numbers\n **parent** - parent of subdomain\n **parentId** - id of parent',
            required: true,
            schema: {
              example: {
                name: 'van',
                owner: 'grampo',
                parentId: '5e907213bc17bb418517a640',
                host: 'example.com',
              },
            },
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'Hive user access token',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: {
                result: {
                  id: 'c779b850f073f631c1f3aaf1ec5af44931dc074f',
                  block_num: 47590315,
                  trx_num: 8,
                  expired: false,
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          409: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Subdomain already exists',
              },
            },
          },
          404: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Parent not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/getParents': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get all available parents',
        description: 'Return list of parent domains which allow to create website',
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
        ],
        produces: [
          'application/json',
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              example: [
                {
                  domain: 'dining.gifts',
                  id: '5e907213bc17bb418517a640',
                },
              ],
            },
          },
        },
      },
    },
    '/api/sites/checkAvailable': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Check for subdomain availability',
        description: 'Return boolean response about subdomain availability',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'name',
            in: 'query',
            description: 'name of subdomain - allow only lowercase and numbers',
            required: true,
            type: 'string',
          },
          {
            name: 'parentId',
            in: 'query',
            description: 'id of subdomain parent',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'host of domain',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: {
                result: true,
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          409: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Subdomain already exists',
              },
            },
          },
          404: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Parent not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/check-ns': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Check for ns is correct',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'host',
            in: 'query',
            description: 'host of domain',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/sites/manage': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Data for manage page',
        description: 'Return all data for load manage page',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'userName',
            in: 'query',
            description: 'name of authorised user',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'access-token',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/managePage',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Token not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/configuration': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of configurations  which can be changed',
        description: 'Get list of configurations  which can be changed',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'host',
            in: 'query',
            description: 'Website host',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              example: {
                configurationFields: [
                  'desktopLogo',
                  'mobileLogo',
                  'aboutObject',
                  'desktopMap',
                  'mobileMap',
                  'colors',
                ],
                colors: {
                  background: null,
                  font: null,
                  hover: null,
                  header: null,
                  button: null,
                  border: null,
                  focus: null,
                  links: null,
                },
              },
            },
          },
          404: {
            description: 'Not found',
            schema: {
              example: {
                message: 'Not found',
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
      post: {
        tags: [
          'sites',
        ],
        summary: 'Update list of configurations',
        description: 'Update and return list of configurations with colors',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: '**userName** - name of user - who owned website\n, **host** - name of host to update\n **configuration** - configurations for app(all fields required), for fields topPoint (it is array with numbers [longitude, latitude]) and bottomPoint(it is array with numbers [longitude, latitude]) - (topPoint - upper right coordinates, bottomPoint - bottom left coordinates) \n',
            required: true,
            schema: {
              $ref: '#/definitions/siteConfigurations',
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/siteConfigurations',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Unauthorized',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/map': {
      post: {
        tags: [
          'sites',
        ],
        summary: 'Return wobjects in a given range of coordinates',
        description: 'Return wobjects in a given range of coordinates by rectangle',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: '**skip** - skip wobjects \n**limit** - wobjectslimit \n**userName** - name of user\n, **topPoint** (it is array with numbers [longitude, latitude])- upper right coordinates \n **bottomPoint**(it is array with numbers [longitude, latitude]) - bottom left coordinates',
            required: true,
            schema: {
              $ref: '#/definitions/getMap',
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                wobjects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    example: {
                      author_permlink: 'iwh-sushi-mura',
                      weight: 48761893.21,
                      default_name: 'Sushi Mura',
                      parent: '',
                      campaigns: {
                        min_reward: 0.001,
                        max_reward: 0.01,
                      },
                      name: 'Sushi Mura',
                      avatar: 'https://waivio.nyc3.digitaloceanspaces.com/1562259502_01bd13b0-180f-4e19-ba1a-c8a5b6b8c697',
                      map: '{"latitude":49.2268638,"longitude":-123.1288576}',
                      defaultShowLink: '/object/iwh-sushi-mura',
                      exposedFields: [],
                    },
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Unauthorized',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
      put: {
        tags: [
          'sites',
        ],
        summary: 'Update map points for supported objects of website',
        description: 'Update map points for supported objects of website',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'access token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: '**userName** - name of user\n**topPoint** (it is array with numbers [longitude, latitude])- upper right coordinates \n **bottomPoint**(it is array with numbers [longitude, latitude]) - bottom left coordinates **center** (it is array with numbers [latitude, longitude])- coordinates for client \n**zoom** - number, zoom on map (client) \n',
            required: true,
            schema: {
              type: 'object',
              example: {
                host: 'van.dining.gifts',
                userName: 'grampo',
                mapCoordinates: [
                  {
                    topPoint: [
                      -91.479002,
                      68.117143,
                    ],
                    bottomPoint: [
                      -131.139244,
                      49.152501,
                    ],
                    center: [
                      -110.479002,
                      70.117143,
                    ],
                    zoom: 5,
                  },
                ],
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/mapCoordinates',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Unauthorized',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
      get: {
        tags: [
          'sites',
        ],
        summary: 'Return points for boxes at map',
        description: 'Return points for boxes at map',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            description: 'host to return map points',
            in: 'query',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/getMapCoordinates',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/report': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Data for report page',
        description: 'Generate data for reports',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'name of authorised user',
            required: true,
            type: 'string',
          },
          {
            name: 'currency',
            in: 'query',
            description: 'currency',
            required: false,
            type: 'string',
            enum: ['USD', 'CAD', 'EUR', 'AUD', 'MXN', 'GBP', 'JPY', 'CNY', 'RUB', 'UAH', 'CHF'],
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'access-token',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'to get report only for one selected host',
            required: false,
            type: 'string',
          },
          {
            name: 'endDate',
            in: 'query',
            description: 'Field for generating a report before a specified date(timestamp)',
            required: false,
            type: 'number',
          },
          {
            name: 'startDate',
            in: 'query',
            description: 'Field for generating a report after a specified date(timestamp)',
            required: false,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/reportPage',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Token not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/moderators': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of site moderators',
        description: 'Return list of site moderators',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'name of host',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'name of user',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/authorities',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/administrators': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of site administrators',
        description: 'Return list of site administrators',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'name of host',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'name of user',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/authorities',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/authorities': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of site authorities',
        description: 'Return list of site authorities',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'name of host',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'name of user',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/authorities',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/tags': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of tags for certain tag category',
        description: 'Return list of tags for certain tag category',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'category',
            in: 'query',
            description: 'Tag Category for search',
            required: true,
            type: 'string',
          },
          {
            name: 'string',
            in: 'query',
            description: 'search string',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              example: [
                'amdina',
                'dish',
                'dinner',
              ],
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/sites/filters': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of object filters',
        description: 'Return list of object filters with tag categories for add tags',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'host',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'host owner name',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/getObjectFilters',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Unauthorized',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
      post: {
        tags: [
          'sites',
        ],
        summary: 'Update list of object filters',
        description: 'Update and return list of object filters with tag categories for add tags',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: '**userName** - name of user - who owned website\n, **host** - name of host to update\n **objectsFilter** - objectsFilter for app(all fields required) \n',
            required: true,
            schema: {
              example: {
                host: 'van.dining.gifts',
                userName: 'grampo',
                objectsFilter: {
                  restaurant: {
                    Cuisine: [],
                  },
                  dish: {
                    Ingredients: [],
                  },
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/getObjectFilters',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Unauthorized',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/refunds': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of pending refunds',
        description: 'Return list of site pending refunds, only website admins can get this info',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'user access token',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'name of waivio admin',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/refund',
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Unauthorized',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
        },
      },
    },
    '/api/sites/settings': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get site settings',
        description: 'Return special fields from app',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'host',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              example: {
                beneficiary: {
                  account: 'string',
                  percent: 'number',
                },
                googleAnalyticsTag: 'string',
                googleGSCTag: 'string',
                referralCommissionAcc: 'string',
                currency: 'string',
              },
            },
          },
          404: {
            description: 'NotFound',
            schema: {
              example: {
                message: 'App not found',
              },
            },
          },
          422: {
            description: 'Unprocessible Entity',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/sites/restrictions': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get muted and blacklisted users',
        description: 'Get muted and blacklisted users of particular site',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'access-token',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            description: 'userName',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            description: 'site host',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                mutedUsers: {
                  $ref: '#/definitions/params_18',
                },
                blacklistUsers: {
                  $ref: '#/definitions/params_18',
                },
                mutedCount: {
                  type: 'number',
                },
                blacklistedCount: {
                  type: 'number',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            schema: {
              example: {
                message: 'Token not found',
              },
            },
          },
          422: {
            description: 'Unprocessable Entity',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/sites/prefetch': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of prefetches by app',
        description: 'Return list of prefetches that have been added to the app',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'types',
            in: 'query',
            description: 'types by which the selections will be searched',
            required: true,
            schema: {
              type: 'string',
              example: 'restaurant,dish,drink',
            },
          },
          {
            name: 'skip',
            in: 'query',
            description: 'count of prefetches to skip',
            required: false,
            default: 0,
            type: 'number',
          },
          {
            name: 'limit',
            in: 'query',
            description: 'limit prefetches in list',
            required: false,
            default: 30,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/created_prefetch_schema',
              },
            },
          },
        },
      },
      post: {
        tags: [
          'sites',
        ],
        summary: 'Created new prefetch',
        description: 'Created new prefetch, do not attach to any application',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: '**name** - name for the new prefetch,\n**tag** - main search parameter,\n**type** - type of objects by which the search will be performed,\n**category** - the category in which the tag will be searched,\n**image** - link to image that will be saved and used for display\n',
            required: true,
            schema: {
              $ref: '#/definitions/prefetch_schema',
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/created_prefetch_schema',
            },
          },
          406: {
            description: 'Return error if it was not possible save image to S3',
            schema: {
              example: {
                message: 'Error download image to S3',
              },
            },
          },
        },
      },
      put: {
        tags: [
          'sites',
        ],
        summary: 'Updated the prefetch list',
        description: 'Updated the prefetch list for a specific app',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'header',
            description: 'name of authorised user',
            required: true,
            type: 'string',
          },
          {
            name: 'access-token',
            in: 'header',
            description: 'access-token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            description: '**names** - array of prefetch names that will be saved to the app,\n',
            required: true,
            schema: {
              example: {
                names: [
                  'Vancouver Restaurants',
                  'Breakfast Places',
                ],
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation, return updated array of prefetches by app',
            schema: {
              example: {
                names: [
                  'Vancouver Restaurants',
                  'Breakfast Places',
                ],
              },
            },
          },
          403: {
            description: 'Return error if the user who makes the changes is not the owner or admin of the app',
            schema: {
              example: {
                message: 'Access denied',
              },
            },
          },
        },
      },
    },
    '/api/sites/all-prefetches': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list of all prefetches',
        description: 'Get a list of all prefetches of a specific type (no matter the app)',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'types',
            in: 'query',
            description: 'types by which the selections will be searched',
            required: true,
            schema: {
              type: 'string',
              example: 'restaurant,dish,drink',
            },
          },
          {
            name: 'skip',
            in: 'query',
            description: 'count of prefetches to skip',
            required: false,
            default: 0,
            type: 'number',
          },
          {
            name: 'limit',
            in: 'query',
            description: 'limit prefetches in list',
            required: false,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/created_prefetch_schema',
              },
            },
          },
        },
      },
    },
    '/api/sites/affiliate': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get list affiliate by host',
        description: 'Get list affiliate by host',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'access-token',
            required: true,
            type: 'string',
          },
          {
            name: 'host',
            in: 'query',
            required: true,
            type: 'string',
          },
          {
            name: 'userName',
            in: 'query',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                links: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/affiliate_list',
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: [
          'sites',
        ],
        summary: 'Update list affiliate by host',
        description: 'Update list affiliate by host',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'access-token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            schema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                },
                userName: {
                  type: 'string',
                },
                links: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/affiliate_list',
                  },
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                updated: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
    '/api/sites/ad-sense': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get ad-sense by host',
        description: 'Get ad-sense by host',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'host',
            in: 'query',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/ad_sense',
            },
          },
        },
      },
    },
    '/api/sites/parent-host': {
      get: {
        tags: [
          'sites',
        ],
        summary: 'Get parent host by host',
        description: 'Get parent host by host',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'host',
            in: 'query',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/api/sites/assistant/custom': {
      post: {
        tags: [
          'sites',
        ],
        summary: 'update AI knowledge',
        description: 'update AI knowledge',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            description: 'access-token',
            required: true,
            type: 'string',
          },
          {
            name: 'params',
            in: 'body',
            schema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                },
                userName: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },

    '/api/objectTypes': {
      post: {
        tags: [
          'object_type',
        ],
        summary: 'Return list of Object Types',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'app',
            in: 'header',
            description: 'Specify app to enable waivio-wobject moderation',
            required: false,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            description: '**limit** - Count of object_typs to return (*default* 30),\n**skip** - Count of skipping object_type(for infinite scroll),\n**wobjects_count** - Count of related wobjects to return(default 3)\n',
            required: false,
            schema: {
              $ref: '#/definitions/params_14',
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/inline_response_200_19',
              },
            },
          },
        },
      },
    },
    '/api/objectType/{name}': {
      post: {
        tags: [
          'object_type',
        ],
        summary: 'Return Object Type details',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'app',
            in: 'header',
            description: 'Specify app to enable waivio-wobject moderation',
            required: false,
            type: 'string',
          },
          {
            name: 'name',
            in: 'path',
            description: 'Name of Object Type',
            required: true,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            description: '**simplified** - boolean flag for simply result for map\n**userName** - name of user, who make request\n**wobjects_count** - Count of wobjects to return (*default* 30),\n**wobjects_skip** - Count of skipping object(for infinite scroll),\n**filter** - advanced filter for *wobjects* current *Object Type*,\n**filter.map** - composite param, to find wobjects in radius\n**filter.map.coordinates** - coordinates of point to search([**latitude, longitude**])\n**filter.map.radius** - radius around of point to search(**meters**)\n**sort** - Sort by "weight" or "proximity" *(if use proximity, require to use **map** filter)*\n',
            required: false,
            schema: {
              $ref: '#/definitions/params_15',
            },
          },
        ],
        responses: {
          200: {
            description: 'succesfull operation',
            schema: {
              $ref: '#/definitions/inline_response_200_20',
            },
          },
          404: {
            description: 'not found',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/objectType/{name}/expertise': {
      get: {
        tags: [
          'object_type',
        ],
        summary: 'Return Object Type experts',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'name',
            in: 'path',
            description: 'Name of Object Type',
            required: true,
            type: 'string',
          },
          {
            name: 'skip',
            in: 'query',
            description: 'Count of experts to skip, (default 0)',
            required: false,
            type: 'integer',
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Count of experts to return, (default 5)',
            required: false,
            type: 'integer',
          },
        ],
        responses: {
          200: {
            description: 'succesfull operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/inline_response_200_21',
              },
            },
          },
        },
      },
    },
    '/api/ObjectTypesSearch': {
      post: {
        tags: [
          'object_type',
        ],
        summary: 'Search by name on Object Types',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'app',
            in: 'header',
            description: 'Specify app to enable waivio-wobject moderation',
            required: false,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            description: '**search_string** - Name or part of name Object Type\n**limit** - Count of object_typs to return (*default* 30),\n**skip** - Count of skipping object_type(for infinite scroll), *required*\n',
            required: false,
            schema: {
              $ref: '#/definitions/params_16',
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/ObjectType',
              },
            },
          },
          422: {
            description: 'Unprocessible Entity',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/objectType/showMoreTags': {
      get: {
        tags: [
          'object_type',
        ],
        summary: 'Return tags by tagCategory',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'skip',
            in: 'query',
            description: 'Count of tags to skip',
            required: false,
            type: 'integer',
            default: 0,
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Count of tags to return',
            required: false,
            type: 'integer',
            default: 10,
          },
          {
            name: 'tagCategory',
            in: 'query',
            description: 'name of tagCategory',
            required: true,
            type: 'string',
          },
          {
            name: 'objectType',
            in: 'query',
            description: 'type of object',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'succesfull operation',
            schema: {
              type: 'object',
              properties: {
                tagCategory: {
                  type: 'string',
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'Unprocessible Entity',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/objectTypes/tags-for-filter': {
      post: {
        tags: [
          'object_type',
        ],
        summary: 'Return tags for filter',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            description: '**objectType** - string, name  of objectType required\n **wobjectLinks** - array wojects author_permlink',
            required: true,
            schema: {
              example: {
                objectType: 'restaurant',
                wobjectLinks: [
                  'wgv-dark-place',
                  'vvr-floret',
                  'iwh-sushi-mura',
                  'kri-not-bad-advice',
                ],
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'succesfull operation',
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tagCategory: {
                    type: 'string',
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  hasMore: {
                    type: 'boolean',
                  },
                },
              },
            },
          },
          422: {
            description: 'Unprocessible Entity',
            schema: {
              $ref: '#/definitions/inline_response_400',
            },
          },
        },
      },
    },
    '/api/generalSearch': {
      post: {
        tags: [
          'general-search',
        ],
        summary: 'Search by wobjects, users, object-types',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'app',
            in: 'header',
            description: 'Specify app to enable waivio-wobject moderation',
            required: false,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            description: '**string** - String to search\n**userLimit** - Count of users to return (*default* 20),\n**wobjectsLimit** - Count of wobjects to return (*default* 20),\n**objectsTypeLimit** - Count of object types to return (*default* 20),\n**sortByApp** - Change priority of returning wobjects by cruical to specified App\n **user** - User name for check his followings',
            required: false,
            schema: {
              $ref: '#/definitions/params_17',
            },
          },
          {
            name: 'following',
            in: 'header',
            description: 'name of user who make request to check founded users in his followings',
            required: false,
            type: 'string',
          },
          {
            name: 'follower',
            in: 'header',
            description: 'name of user who make request to check founded users in his followers',
            required: false,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/inline_response_200_22',
            },
          },
        },
      },
    },
    '/api/image': {
      post: {
        tags: [
          'image',
        ],
        summary: 'Upload image and get link',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'app',
            in: 'header',
            description: 'Specify app to enable waivio-wobject moderation',
            required: false,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            description: '**file** - Image file in form data, or\n **imageUrl** - link to exists image',
            required: false,
            schema: {
              type: 'object',
              properties: {
                imageUrl: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation, link to uploaded image',
            schema: {
              type: 'object',
              properties: {
                image: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/api/app/{appName}': {
      get: {
        tags: [
          'app',
        ],
        summary: 'Get waivio "App"',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'appName',
            in: 'path',
            description: 'Name of registered "App" on waivio',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation, link to uploaded image',
            schema: {
              $ref: '#/definitions/inline_response_200_23',
            },
          },
        },
      },
    },
    '/api/app/{appName}/experts': {
      get: {
        tags: [
          'app',
        ],
        summary: 'Get experts by specified app',
        description: 'If specified app has own supported_objects => return users which has some weight in this wobjects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'appName',
            in: 'path',
            description: 'Name of registered "App" on waivio',
            required: true,
            type: 'string',
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Count of users to return(default 10)',
            required: false,
            type: 'number',
          },
          {
            name: 'skip',
            in: 'query',
            description: 'Count of users to skip, for infinite scroll(default 0)',
            required: false,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/inline_response_200_13',
              },
            },
          },
        },
      },
    },
    '/api/app/{name}/hashtags': {
      get: {
        tags: [
          'app',
        ],
        summary: 'Get specified hashtags by app',
        description: 'If app has "supported_hashtags" => return array of this wobjects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'Origin',
            in: 'header',
            description: 'Domain of website',
            required: true,
            type: 'string',
          },
          {
            name: 'app',
            in: 'header',
            description: 'Specify app to enable waivio-wobject moderation',
            required: false,
            type: 'string',
          },
          {
            name: 'name',
            in: 'path',
            description: 'Name of registered "App" on waivio',
            required: true,
            type: 'string',
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Count of hashtags to return(default 30)',
            required: false,
            type: 'number',
          },
          {
            name: 'skip',
            in: 'query',
            description: 'Count of hashtags to skip, for infinite scroll(default 0)',
            required: false,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                $ref: '#/definitions/inline_response_200_12',
              },
            },
          },
        },
      },
    },
    '/api/waiv/metrics': {
      get: {
        tags: [
          'app',
        ],
        summary: 'Get WAIV metrics',
        produces: [
          'application/json',
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                tokensInCirculation: {
                  type: 'string',
                },
                tokensStaked: {
                  type: 'string',
                },
                totalMarketCapitalizationUSD: {
                  type: 'string',
                },
                annualInflation: {
                  type: 'string',
                },
                totalShares: {
                  type: 'string',
                },
                availableInMonthUSD: {
                  type: 'string',
                },
                distributedInMonthUSD: {
                  type: 'string',
                },
                inflationDistribution: {
                  type: 'object',
                  properties: {
                    rewardsPool: {
                      type: 'string',
                    },
                    developmentFund: {
                      type: 'string',
                    },
                    liquidityProviders: {
                      type: 'string',
                    },
                  },
                },
                rewardsPool: {
                  type: 'object',
                  properties: {
                    authors: {
                      type: 'string',
                    },
                    curators: {
                      type: 'string',
                    },
                  },
                },
                positions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'number',
                      },
                      account: {
                        type: 'string',
                      },
                      tokenPair: {
                        type: 'string',
                      },
                      shares: {
                        type: 'string',
                      },
                      timeFactor: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/waiv/swap-history': {
      get: {
        tags: [
          'app',
        ],
        summary: 'Get WAIV swap history',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Count of users to return(default 10)',
            required: false,
            type: 'number',
          },
          {
            name: 'skip',
            in: 'query',
            description: 'Count of users to skip, for infinite scroll(default 0)',
            required: false,
            type: 'number',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                      },
                      blockNumber: {
                        type: 'number',
                      },
                      transactionId: {
                        type: 'string',
                      },
                      account: {
                        type: 'string',
                      },
                      operation: {
                        type: 'string',
                      },
                      refHiveBlockNumber: {
                        type: 'number',
                      },
                      symbolOut: {
                        type: 'string',
                      },
                      symbolIn: {
                        type: 'string',
                      },
                      symbolOutQuantity: {
                        type: 'string',
                      },
                      symbolInQuantity: {
                        type: 'string',
                      },
                      timestamp: {
                        type: 'number',
                      },
                    },
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
    '/api/assistant': {
      post: {
        tags: [
          'app',
        ],
        summary: 'prompt to assistant',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                },
                id: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/api/assistant/history/{id}': {
      get: {
        tags: [
          'app',
        ],
        summary: 'prompt to assistant',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'chat id',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                      },
                      text: {
                        type: 'string',
                      },
                      role: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/places-api/image': {
      post: {
        tags: [
          'app',
        ],
        summary: 'prompt to assistant',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                placesUrl: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/api/places-api/objects': {
      post: {
        tags: [
          'app',
        ],
        summary: 'prompt to assistant',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                longitude: {
                  type: 'number',
                },
                latitude: {
                  type: 'number',
                },
                includedTypes: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/places-api/text': {
      post: {
        tags: [
          'app',
        ],
        summary: 'prompt to assistant',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                longitude: {
                  type: 'number',
                },
                latitude: {
                  type: 'number',
                },
                includedType: {
                  type: 'string',
                },
                textQuery: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/user/{userName}/draft': {
      post: {
        tags: [
          'user',
        ],
        summary: 'Creates or updates draft on wobject of type page',
        description: 'Authorized user may have one draft on wobject of type page',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            type: 'string',
          },
          {
            name: 'user',
            in: 'path',
            description: 'Name of authorized user',
            required: true,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                authorPermlink: {
                  type: 'string',
                },
                body: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                user: {
                  type: 'string',
                },
                author_permlink: {
                  type: 'string',
                },
                body: {
                  type: 'string',
                },
              },
            },
          },
          401: {
            description: 'Token not valid!',
          },
          404: {
            description: 'Not found',
          },
          422: {
            description: 'Validation error',
          },
        },
      },
    },
    '/user/{userName}/draft/?{authorPermlink}': {
      get: {
        tags: [
          'user',
        ],
        summary: 'Gets draft by authorized author on wobject of type page',
        description: 'Returns draft of wobject of type page',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'access-token',
            in: 'header',
            type: 'string',
          },
          {
            name: 'user',
            in: 'path',
            description: 'Name of authorized user',
            required: true,
            type: 'string',
          },
          {
            name: 'authorPermlink',
            in: 'query',
            description: 'author_permlink of wobject of type page',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                user: {
                  type: 'string',
                },
                author_permlink: {
                  type: 'string',
                },
                body: {
                  type: 'string',
                },
              },
            },
          },
          401: {
            description: 'Token not valid!',
          },
          404: {
            description: 'Not found',
          },
          422: {
            description: 'Validation error',
          },
        },
      },
    },
    '/api/users/guest-wallet/hive-withdraw': {
      post: {
        tags: ['user'],
        description: 'create withdraw for guest user',
        produces: ['application/json'],
        parameters: [{
          name: 'waivio-auth',
          in: 'header',
          description: 'send if it is guest',
          required: true,
          type: 'boolean',
        },
        {
          name: 'access-token',
          in: 'header',
          description: 'SteemConnect Access Token to identify user identity',
          required: true,
          type: 'string',
        },
        {
          name: 'params',
          in: 'body',
          description: 'no params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
              },
              outputCoinType: {
                type: 'string',
              },
              userName: {
                type: 'string',
              },
              address: {
                type: 'string',
              },
            },
          },
        }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/users/hive-withdraw': {
      post: {
        tags: ['user'],
        description: 'create withdraw for hive user',
        produces: ['application/json'],
        parameters: [{
          name: 'waivio-auth',
          in: 'header',
          description: 'send if it is guest',
          required: true,
          type: 'boolean',
        },
        {
          name: 'access-token',
          in: 'header',
          description: 'Access Token to identify user identity',
          required: true,
          type: 'string',
        },
        {
          name: 'params',
          in: 'body',
          description: 'no params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
              },
              outputCoinType: {
                type: 'string',
              },
              userName: {
                type: 'string',
              },
              address: {
                type: 'string',
              },
            },
          },
        }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  $ref: '#/definitions/withdrawHiveTransaction',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/users/guest-wallet/hive-withdraw-estimates': {
      post: {
        tags: ['user'],
        description: 'estimate amount outputCoinType',
        produces: ['application/json'],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                amount: {
                  type: 'number',
                },
                outputCoinType: {
                  type: 'string',
                },
              },
            },
          }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'string',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/users/guest-wallet/hive-withdraw-range': {
      post: {
        tags: ['user'],
        description: 'range min max amount',
        produces: ['application/json'],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                outputCoinType: {
                  type: 'string',
                },
              },
            },
          }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                min: {
                  type: 'string',
                },
                max: {
                  type: 'string',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/users/min-reject': {
      post: {
        tags: ['user'],
        description: 'min reject amount on updates',
        produces: ['application/json'],
        parameters: [
          {
            name: 'params',
            in: 'body',
            description: 'no params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                author: {
                  type: 'string',
                },
                permlink: {
                  type: 'string',
                },
                authorPermlink: {
                  type: 'string',
                },
              },
            },
          }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'number',
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/api/users/avatar': {
      post: {
        tags: ['user'],
        description: 'get users avatar',
        produces: ['application/json'],
        parameters: [
          {
            name: 'params',
            in: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                names: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          }],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  image: {
                    type: 'string',
                  },
                },
              },
            },
          },
          422: {
            description: 'ValidationError',
            schema: {
              example: {
                message: 'Validation Error',
              },
            },
          },
        },
      },
    },
    '/user/{userName}/affiliate': {
      post: {
        tags: [
          'user',
        ],
        summary: 'get affiliate objects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'userName',
            in: 'path',
            description: 'Name of authorized user',
            required: true,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              $ref: '#/definitions/wobjectonlist',
            },
          },
          401: {
            description: 'Token not valid!',
          },
          404: {
            description: 'Not found',
          },
          422: {
            description: 'Validation error',
          },
        },
      },
    },
    '/api/user/{userName}/favorites': {
      post: {
        tags: ['user'],
        summary: 'get favorite objects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'userName',
            in: 'path',
            description: 'Name of user',
            required: true,
            type: 'string',
          },
          {
            name: 'follower',
            in: 'header',
            description: 'Name of authorized user',
            required: true,
            type: 'string',
          },
          {
            name: 'locale',
            in: 'header',
            description: 'locale',
            required: true,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                objectType: {
                  type: 'string',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/wobjectonlist',
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'Validation error',
          },
        },
      },
    },
    '/api/user/{userName}/favorites/list': {
      get: {
        tags: ['user'],
        summary: 'get favorite objects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'userName',
            in: 'path',
            description: 'Name of user',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          422: {
            description: 'Validation error',
          },
        },
      },
    },
    '/api/user/{userName}/favorites/map': {
      post: {
        tags: ['user'],
        summary: 'get favorite objects',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'userName',
            in: 'path',
            description: 'Name of user',
            required: true,
            type: 'string',
          },
          {
            name: 'follower',
            in: 'header',
            description: 'Name of authorized user',
            required: true,
            type: 'string',
          },
          {
            name: 'locale',
            in: 'header',
            description: 'locale',
            required: true,
            type: 'string',
          },
          {
            in: 'body',
            name: 'params',
            required: true,
            schema: {
              type: 'object',
              properties: {
                objectTypes: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                box: {
                  $ref: '#/definitions/box_params',
                },
                skip: {
                  type: 'number',
                },
                limit: {
                  type: 'number',
                },
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/wobjectonlist',
                  },
                },
                hasMore: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'Validation error',
          },
        },
      },
    },
    '/api/user/{userName}/hive-exist': {
      get: {
        tags: ['user'],
        summary: 'check if hive user exists',
        produces: [
          'application/json',
        ],
        parameters: [
          {
            name: 'userName',
            in: 'path',
            description: 'Name of user',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            schema: {
              type: 'object',
              properties: {
                result: {
                  type: 'boolean',
                },
              },
            },
          },
          422: {
            description: 'Validation error',
          },
        },
      },
    },
  },
  definitions: {
    hashtagCount: {
      type: 'object',
      properties: {
        hashtag: {
          type: 'string',
        },
        count: {
          type: 'number',
        },
      },
    },
    thread: {
      type: 'object',
      properties: {
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        parent_author: {
          type: 'string',
        },
        parent_permlink: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
        replies: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        children: {
          type: 'number',
        },
        depth: {
          type: 'number',
        },
        stats: {
          type: 'object',
          properties: {
            total_votes: {
              type: 'number',
            },
          },
        },
        author_reputation: {
          type: 'number',
        },
        deleted: {
          type: 'boolean',
        },
        tickers: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        mentions: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        hashtags: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        links: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        threadstorm: {
          type: 'boolean',
        },
        net_rshares: {
          type: 'number',
        },
      },
    },
    postDraft: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        draftId: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        beneficiary: {
          type: 'boolean',
        },
        isUpdating: {
          type: 'boolean',
        },
        upvote: {
          type: 'boolean',
        },
        body: {
          type: 'string',
        },
        originalBody: {
          type: 'string',
        },
        jsonMetadata: {
          type: 'object',
        },
        lastUpdated: {
          type: 'number',
        },
        parentAuthor: {
          type: 'string',
        },
        parentPermlink: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        reward: {
          type: 'string',
        },
      },
    },
    objectDraft: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
        },
        authorPermlink: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
      },
    },
    commentDraft: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
      },
    },
    delegation_response_200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          received: {
            type: 'array',
            items: {
              $ref: '#/definitions/delegationData',
            },
          },
          delegated: {
            type: 'array',
            items: {
              $ref: '#/definitions/delegationData',
            },
          },
          expirations: {
            type: 'array',
            items: {
              $ref: '#/definitions/expirationsData',
            },
          },
        },
      },
    },
    delegationData: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
        delegator: {
          type: 'string',
        },
        delegatee: {
          type: 'string',
        },
        vesting_shares: {
          type: 'number',
        },
        delegation_date: {
          type: 'string',
        },
      },
    },
    expirationsData: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
        delegator: {
          type: 'string',
        },
        vesting_shares: {
          type: 'number',
        },
        expiration: {
          type: 'string',
        },
      },
    },
    vipTicket: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        valid: {
          type: 'boolean',
        },
        userName: {
          type: 'string',
        },
        ticket: {
          type: 'string',
        },
        createdAt: {
          type: 'string',
        },
        updatedAt: {
          type: 'string',
        },
      },
    },
    mapCoordinates: {
      type: 'array',
      example: [
        {
          topPoint: [
            -91.479002,
            68.117143,
          ],
          bottomPoint: [
            -131.139244,
            49.152501,
          ],
        },
      ],
    },
    getMapCoordinates: {
      type: 'object',
      properties: {
        coordinates: {
          type: 'array',
          example: [
            {
              topPoint: [
                -91.479002,
                68.117143,
              ],
              bottomPoint: [
                -131.139244,
                49.152501,
              ],
            },
          ],
        },
        center: {
          type: 'array',
          example: [
            31.479002,
            68.117143,
          ],
        },
        zoom: {
          type: 'number',
        },
      },
    },
    firstLoad: {
      type: 'object',
      example: {
        configuration: {
          configurationFields: [
            'aboutObject',
            'colors',
            'desktopLogo',
            'desktopMap',
            'mobileLogo',
            'mobileMap',
          ],
          desktopLogo: 'https://images.hive.blog/800x600/https://images.hive.blog/p/HNWT6DgoBc196q36ADoGty1WEUBMYTezBR2yx2cmqPwhtM3UzUiz5qh45JxQmtbGZS9PVgVvxPEdKkRDNxzZmkcgxxdnLXMFfLgav4f8ftPqqgVfrVZ3x1kLRtE',
          mobileLogo: 'https://images.hive.blog/800x600/https://images.hive.blog/p/HNWT6DgoBc196q36ADoGty1WEUBMYTezBR2yx2cmqPwhtM3UzUiz5qh45JxQmtbGZS9PVgVvxPEdKkRDNxzZmkcgxxdnLXMFfLgav4f8ftPqqgVfrVZ3x1kLRtE',
          aboutObject: 'hive',
          currency: 'USD',
          desktopMap: {
            topPoint: [
              34.435,
              65.543,
            ],
            bottomPoint: [
              32.435,
              55.543,
            ],
          },
          mobileMap: {
            topPoint: [
              34.435,
              65.543,
            ],
            bottomPoint: [
              32.435,
              55.543,
            ],
          },
          colors: {
            background: '4533',
            font: '3543',
            hover: '3356',
            header: '433',
            button: '634',
            border: '5343',
            focus: '3353',
            links: '4654',
          },
        },
        host: 'van.dining.pp.ua',
        googleAnalyticsTag: null,
        googleGSCTag: null,
        beneficiary: {
          account: 'waivio',
          percent: 300,
        },
        supported_object_types: [
          'dish',
          'restaurant',
          'drink',
        ],
        status: 'active',
        mainPage: 'dining',
      },
    },
    getMap: {
      type: 'object',
      example: {
        userName: 'olegvladim',
        topPoint: [
          34.435,
          65.543,
        ],
        bottomPoint: [
          32.435,
          55.543,
        ],
        limit: 30,
        skip: 0,
      },
    },
    siteConfigurations: {
      type: 'object',
      example: {
        userName: 'olegvladim',
        host: 'van.dining.pp.ua',
        configuration: {
          desktopLogo: 'https://images.hive.blog/800x600/https://images.hive.blog/p/HNWT6DgoBc196q36ADoGty1WEUBMYTezBR2yx2cmqPwhtM3UzUiz5qh45JxQmtbGZS9PVgVvxPEdKkRDNxzZmkcgxxdnLXMFfLgav4f8ftPqqgVfrVZ3x1kLRtE',
          mobileLogo: 'https://images.hive.blog/800x600/https://images.hive.blog/p/HNWT6DgoBc196q36ADoGty1WEUBMYTezBR2yx2cmqPwhtM3UzUiz5qh45JxQmtbGZS9PVgVvxPEdKkRDNxzZmkcgxxdnLXMFfLgav4f8ftPqqgVfrVZ3x1kLRtE',
          aboutObject: 'afd-dfeedcxcb',
          desktopMap: {
            topPoint: [
              34.435,
              65.543,
            ],
            bottomPoint: [
              32.435,
              55.543,
            ],
          },
          mobileMap: {
            topPoint: [
              34.435,
              65.543,
            ],
            bottomPoint: [
              32.435,
              55.543,
            ],
          },
          colors: {
            background: '4533',
            font: '3543',
            hover: '3356',
            header: '433',
            button: '634',
            border: '5343',
            focus: '3353',
            links: '4654',
          },
        },
      },
    },
    getObjectFilters: {
      type: 'object',
      example: {
        restaurant: {
          Cuisine: [
            'asian',
          ],
          Features: [],
          'Good For': [
            'family',
          ],
        },
        dish: {
          Category: [],
          Ingredients: [],
        },
        drink: {
          Category: [],
          Ingredients: [],
        },
      },
    },
    refund: {
      type: 'array',
      example: [
        {
          _id: '5f7ad9c923de933796693d0b',
          status: 'pending',
          description: '',
          rejectMessage: '',
          userName: 'olegvladim',
          type: 'website_refund',
          blockNum: 1234,
          createdAt: '2020-10-05T08:31:05.174Z',
          updatedAt: '2020-10-05T08:31:05.174Z',
          __v: 0,
          amount: 99,
        },
      ],
    },
    authorities: {
      type: 'array',
      example: [
        {
          _id: '5cc3215ad0555b20e1d4d2a3',
          name: 'asd09',
          json_metadata: '{"profile":{"about":"This is a Waivio bot service. It is being used to maintain Object Reference Protocol on Steem blockchain","cover_image":"https://cdn.steemitimages.com/DQmaj3MLuivowwzq9Ks7H6oJJRWMZqMk7ScpmwjovdvdKW5/Positive%20Vibes%20(3).png","location":"Internet","name":"Waivio Service ","profile_image":"https://steemitimages.com/p/4HFqJv9qRjVeVQzX3gvDHytNF793bg88B7fESPieLQ8dxJ6Kt6ZDcMkQZftXp7DiLCjkepEzG4foz3EF6Us1xm5x7MMNraHbpCe8rKsNc1Gou2vSYDYYBMVCijP5JAg2jo25n6eziBrbXsNa3qeoJFBexGLxsyLTCCW","website":"http://waiviodev.com/","twitter":"","youtube":"asd08"}}',
          alias: 'Waivio Service ',
          posting_json_metadata: '{"profile":{"about":"This is a Waivio bot service. It is being used to maintain Object Reference Protocol on Steem blockchain","cover_image":"https://cdn.steemitimages.com/DQmaj3MLuivowwzq9Ks7H6oJJRWMZqMk7ScpmwjovdvdKW5/Positive%20Vibes%20(3).png","location":"Internet","name":"Waivio Service ","profile_image":"https://steemitimages.com/p/4HFqJv9qRjVeVQzX3gvDHytNF793bg88B7fESPieLQ8dxJ6Kt6ZDcMkQZftXp7DiLCjkepEzG4foz3EF6Us1xm5x7MMNraHbpCe8rKsNc1Gou2vSYDYYBMVCijP5JAg2jo25n6eziBrbXsNa3qeoJFBexGLxsyLTCCW","website":"http://waiviodev.com/","twitter":"","youtube":"asd08"}}',
        },
      ],
    },
    reportPage: {
      type: 'object',
      example: {
        payments: [
          {
            userName: 'olegvladim',
            balance: 99,
            host: 'van.dining.pp.ua',
            createdAt: '2020-10-01T12:42:35.519Z',
            amount: 1,
            type: 'writeOff',
            countUsers: 2,
            currencyRate: 1,
          },
          {
            userName: 'olegvladim',
            balance: 100,
            createdAt: '2020-10-01T09:42:35.519Z',
            amount: 100,
            type: 'transfer',
            currencyRate: 1,
          },
        ],
        ownerAppNames: [
          'van.dining.pp.ua',
        ],
        dataForPayments: {
          user: {
            _id: '5caf42256fb6c810cde66d20',
            name: 'waivio.hosting',
            alias: '',
            json_metadata: '',
            posting_json_metadata: '',
          },
          memo: '{"id":"websitesPayment"}',
        },
      },
    },
    managePage: {
      type: 'object',
      example: {
        websites: [
          {
            status: 'pending',
            name: 'van',
            host: 'van.dining.pp.ua',
            parent: 'dining.pp.ua',
            averageDau: 2,
          },
        ],
        prices: {
          minimumValue: 1,
          perUser: 0.005,
          perSuspended: 0.2,
        },
        accountBalance: {
          paid: 99,
          avgDau: 2,
          dailyCost: 0,
          remainingDays: null,
        },
        dataForPayments: {
          user: {
            _id: '5caf42256fb6c810cde66d20',
            name: 'waivio.hosting',
            alias: '',
            json_metadata: '',
            posting_json_metadata: '',
          },
          memo: '{"id":"websitesPayment"}',
        },
      },
    },
    wobjectonlist: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        author_permlink: {
          type: 'string',
        },
        weight: {
          type: 'number',
        },
        user_count: {
          type: 'integer',
        },
        app: {
          type: 'string',
        },
        parents: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        children: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        users: {
          type: 'array',
          items: {
            $ref: '#/definitions/wobjectonlist_users',
          },
        },
        fields: {
          type: 'array',
          items: {
            $ref: '#/definitions/apiuseruserNamefollowing_objects_fields',
          },
        },
      },
    },
    wobject: {
      type: 'object',
      required: ['author_permlink', 'default_name', 'creator', 'author'],
      properties: {
        app: {
          type: 'string',
        },
        community: {
          type: 'string',
        },
        default_name: {
          type: 'string',
        },
        is_posting_open: {
          type: 'boolean',
        },
        is_extending_open: {
          type: 'boolean',
        },
        creator: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        author_permlink: {
          type: 'string',
        },
        weight: {
          type: 'number',
        },
        parent: {
          type: 'object',
        },
        children: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        authority: {
          type: 'object',
        },
        status: {
          type: 'object',
        },
        propositions: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        updatesCount: {
          type: 'number',
          example: 21,
        },
        name: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
        avatar: {
          type: 'string',
        },
        background: {
          type: 'string',
        },
        defaultShowLink: {
          type: 'string',
        },
        rating: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        ratings: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        tagCategory: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        galleryAlbum: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        galleryItem: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        delegation: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        walletAddress: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        similar: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        addOn: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        related: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        pin: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        remove: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        features: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        groupId: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        productId: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        companyId: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        departments: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        authors: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        options: {
          type: 'object',
        },
      },
    },
    wobjField: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
        },
        locale: {
          type: 'string',
        },
        _id: {
          type: 'string',
        },
        creator: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
        children: {
          type: 'number',
        },
        approvePercent: {
          type: 'number',
        },
        active_votes: {
          type: 'array',
          items: {
            $ref: '#/definitions/post_active_votes',
          },
        },
        items: {
          type: 'array',
          items: {
            $ref: '#/definitions/raw_field',
          },
        },
      },
    },
    raw_field: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
        },
        body: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        locale: {
          type: 'string',
        },
        creator: {
          type: 'string',
        },
        active_votes: {
          type: 'array',
          items: {
            $ref: '#/definitions/post_active_votes',
          },
        },
      },
    },
    guest_wallet: {
      type: 'object',
      properties: {
        refHiveBlockNumber: {
          type: 'number',
        },
        blockNumber: {
          type: 'number',
        },
        account: {
          type: 'string',
        },
        transactionId: {
          type: 'string',
        },
        operation: {
          type: 'string',
        },
        timestamp: {
          type: 'number',
        },
        quantity: {
          type: 'string',
        },
        symbol: {
          type: 'string',
        },
        authorperm: {
          type: 'string',
        },
        from: {
          type: 'string',
        },
        to: {
          type: 'string',
        },
      },
    },
    User: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        profile_image: {
          type: 'string',
        },
        objects_following_count: {
          type: 'integer',
        },
        objects_shares_count: {
          type: 'integer',
        },
        objects_follow: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        wobjects_weight: {
          type: 'integer',
        },
        youFollows: {
          type: 'boolean',
        },
        followsYou: {
          type: 'boolean',
        },
        muted: {
          type: 'boolean',
        },
        last_activity: {
          type: 'string',
        },
      },
    },
    ObjectType: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
      },
    },
    post: {
      type: 'object',
      properties: {
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        category: {
          type: 'string',
        },
        parent_author: {
          type: 'string',
        },
        parent_permlink: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
        json_metadata: {
          type: 'string',
        },
        last_update: {
          type: 'string',
        },
        last_payout: {
          type: 'string',
        },
        created: {
          type: 'string',
        },
        active: {
          type: 'string',
        },
        depth: {
          type: 'integer',
        },
        children: {
          type: 'integer',
        },
        net_rshares: {
          type: 'integer',
        },
        abs_rshares: {
          type: 'integer',
        },
        vote_rshares: {
          type: 'integer',
        },
        children_abs_rshares: {
          type: 'integer',
        },
        cashout_time: {
          type: 'string',
        },
        max_cashout_time: {
          type: 'string',
        },
        total_vote_weight: {
          type: 'integer',
        },
        reward_weight: {
          type: 'integer',
        },
        total_payout_value: {
          type: 'integer',
        },
        curator_payout_value: {
          type: 'integer',
        },
        author_rewards: {
          type: 'integer',
        },
        net_votes: {
          type: 'integer',
        },
        root_author: {
          type: 'string',
        },
        root_permlink: {
          type: 'string',
        },
        max_accepted_payout: {
          type: 'string',
        },
        percent_steem_dollars: {
          type: 'integer',
        },
        allow_replies: {
          type: 'boolean',
        },
        allow_votes: {
          type: 'boolean',
        },
        allow_curation_rewards: {
          type: 'boolean',
        },
        beneficiaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        url: {
          type: 'string',
        },
        root_title: {
          type: 'string',
        },
        pending_payout_value: {
          type: 'string',
        },
        active_votes: {
          type: 'array',
          items: {
            $ref: '#/definitions/post_active_votes',
          },
        },
        replies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        author_reputation: {
          type: 'integer',
        },
        promoted: {
          type: 'string',
        },
        body_length: {
          type: 'integer',
        },
        reblogged_by: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        wobjects: {
          type: 'array',
          items: {
            $ref: '#/definitions/wobject',
          },
        },
        youFollows: {
          type: 'boolean',
        },
      },
    },
    postTags: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        counter: {
          type: 'number',
        },
        author_permlink: {
          type: 'string',
        },
      },
    },
    userMetadata: {
      type: 'object',
      properties: {
        user_metadata: {
          $ref: '#/definitions/userMetadata_user_metadata',
        },
      },
      xml: {
        name: 'User',
      },
    },
    inline_response_200: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        wobjects_weight: {
          type: 'number',
        },
        json_metadata: {
          type: 'string',
        },
        youFollows: {
          type: 'boolean',
        },
        followsYou: {
          type: 'boolean',
        },
      },
    },
    params: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        skip: {
          type: 'integer',
        },
        limit: {
          type: 'integer',
        },
        name: {
          type: 'string',
        },
      },
    },
    inline_response_200_1: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200',
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_2: {
      type: 'object',
      properties: {
        result: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_3: {
      type: 'object',
      properties: {
        name: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_4: {
      type: 'object',
      properties: {
        account: {
          type: 'string',
        },
        wobjects_weight: {
          type: 'number',
        },
        followers_count: {
          type: 'number',
        },
        followsYou: {
          type: 'boolean',
        },
        youFollows: {
          type: 'boolean',
        },
      },
    },
    params_1: {
      type: 'object',
      properties: {
        locale: {
          type: 'string',
        },
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
      },
    },
    apiuseruserNamefollowing_objects_fields: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
        weight: {
          type: 'number',
        },
        locale: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
      },
    },
    inline_response_200_5: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        author_permlink: {
          type: 'string',
        },
        weight: {
          type: 'number',
        },
        app: {
          type: 'string',
        },
        parents: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        children: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        fields: {
          type: 'array',
          items: {
            $ref: '#/definitions/apiuseruserNamefollowing_objects_fields',
          },
        },
      },
    },
    inline_response_200_6: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              wobjects_weight: {
                type: 'number',
              },
              followers_count: {
                type: 'number',
              },
              youFollows: {
                type: 'boolean',
              },
              followsYou: {
                type: 'boolean',
              },
            },
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    params_2: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
      },
    },
    params_3: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        count_with_wobj: {
          type: 'integer',
        },
        last_permlink: {
          type: 'string',
        },
        last_author: {
          type: 'string',
        },
        user_languages: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    params_4: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        locale: {
          type: 'string',
        },
        object_types: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        exclude_object_types: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    inline_response_200_7_wobjects: {
      type: 'object',
      properties: {
        author_permlink: {
          type: 'string',
        },
        user_weight: {
          type: 'integer',
        },
        weight: {
          type: 'integer',
        },
        is_posting_open: {
          type: 'boolean',
        },
        is_extending_open: {
          type: 'boolean',
        },
        object_type: {
          type: 'string',
        },
        default_name: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        creator: {
          type: 'string',
        },
        app: {
          type: 'string',
        },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
      },
    },
    inline_response_200_7: {
      type: 'object',
      properties: {
        wobjects: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200_7_wobjects',
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    params_5: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        tagsArray: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    inline_response_200_8: {
      type: 'object',
      properties: {
        followers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              wobjects_weight: {
                type: 'number',
              },
              youFollows: {
                type: 'boolean',
              },
              followsYou: {
                type: 'boolean',
              },
            },
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_9_users_updates_users: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        wobjects_weight: {
          type: 'number',
        },
        last_posts_count: {
          type: 'number',
        },
      },
    },
    inline_response_200_9_users_updates: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200_9_users_updates_users',
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_9_related_wobjects: {
      type: 'object',
      properties: {
        author_permlink: {
          type: 'string',
        },
        user_weight: {
          type: 'number',
        },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        last_posts_count: {
          type: 'number',
        },
      },
    },
    inline_response_200_9_wobjects_updates: {
      type: 'object',
      properties: {
        object_type: {
          type: 'string',
        },
        related_wobjects: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200_9_related_wobjects',
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_9: {
      type: 'object',
      properties: {
        users_updates: {
          $ref: '#/definitions/inline_response_200_9_users_updates',
        },
        wobjects_updates: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200_9_wobjects_updates',
          },
        },
      },
    },
    inline_response_200_10: {
      type: 'object',
      properties: {
        related_wobjects: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200_9_related_wobjects',
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_11: {
      type: 'object',
      properties: {
        ok: {
          type: 'string',
        },
      },
    },
    inline_response_400: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
      },
    },
    apiwobject_map: {
      type: 'object',
      properties: {
        coordinates: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        radius: {
          type: 'number',
        },
      },
    },
    params_6: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        user_limit: {
          type: 'integer',
        },
        locale: {
          type: 'string',
        },
        author_permlinks: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        object_types: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        exclude_object_types: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        required_fields: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        sample: {
          type: 'boolean',
        },
        map: {
          $ref: '#/definitions/apiwobject_map',
        },
      },
    },
    inline_response_200_12: {
      type: 'object',
      properties: {
        hasMore: {
          type: 'boolean',
        },
        wobjects: {
          type: 'array',
          items: {
            $ref: '#/definitions/wobjectonlist',
          },
        },
      },
    },
    params_7: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        user_languages: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    params_8: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        sort: {
          type: 'string',
        },
      },
    },
    inline_response_200_13: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        weight: {
          type: 'number',
        },
      },
    },
    params_9: {
      type: 'object',
      properties: {
        fields_names: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        custom_fields: {
          type: 'object',
          properties: {},
        },
      },
      example: {
        fields_names: [
          'categoryItem',
        ],
        custom_fields: {
          categoryId: 123456,
        },
      },
    },
    inline_response_200_14: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
        weight: {
          type: 'integer',
        },
        locale: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
      },
    },
    inline_response_200_15: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
        weight: {
          type: 'integer',
        },
        locale: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
      },
    },
    params_10: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        user: {
          type: 'string',
        },
        newsFilter: {
          type: 'string',
        },
      },
    },
    inline_response_200_16_users: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        weight: {
          type: 'integer',
        },
      },
    },
    inline_response_200_16_users2: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        weight: {
          type: 'integer',
        },
        youFollows: {
          type: 'boolean',
        },
        followsYou: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_get_wobj_fields: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
        },
        locale: {
          type: 'string',
        },
        _id: {
          type: 'string',
        },
        creator: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        body: {
          type: 'number',
        },
        active_votes: {
          type: 'array',
        },
        children: {
          type: 'number',
        },
        total_payout_value: {
          type: 'string',
        },
        pending_payout_value: {
          type: 'string',
        },
        curator_payout_value: {
          type: 'string',
        },
        cashout_time: {
          type: 'string',
        },
        fullBody: {
          type: 'string',
        },
        approvePercent: {
          type: 'number',
        },
        createdAt: {
          type: 'number',
        },
      },
    },
    inline_response_200_16_users3: {
      type: 'object',
      properties: {
        wobjectFollowers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              wobjects_weight: {
                type: 'number',
              },
              followers_count: {
                type: 'number',
              },
              youFollows: {
                type: 'boolean',
              },
              followsYou: {
                type: 'boolean',
              },
            },
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    inline_response_200_16: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200_16_users2',
          },
        },
        user: {
          $ref: '#/definitions/inline_response_200_16_users',
        },
      },
    },
    params_11: {
      type: 'object',
      required: [
        'search_string',
      ],
      properties: {
        search_string: {
          type: 'string',
        },
        sort: {
          type: 'string',
          enum: [
            'weight',
            'createdAt',
          ],
          default: 'weight',
        },
        object_type: {
          type: 'string',
        },
        userName: {
          type: 'string',
        },
        simplified: {
          type: 'boolean',
        },
        map: {
          type: 'object',
          properties: {
            coordinates: {
              type: 'array',
              items: {
                type: 'number',
              },
            },
            radius: {
              type: 'number',
            },
          },
        },
        tagCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryName: {
                type: 'string',
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        locale: {
          type: 'string',
        },
        sortByApp: {
          type: 'string',
        },
        required_fields: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        box: {
          $ref: '#/definitions/box_params',
        },
        addHashtag: {
          type: 'boolean',
        },
        mapMarkers: {
          type: 'boolean',
        },
        onlyObjectTypes: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    params_wobject_map_last_post: {
      type: 'object',
      properties: {
        box: {
          $ref: '#/definitions/box_params',
        },
        skip: {
          type: 'number',
        },
        limit: {
          type: 'number',
        },
        objectType: {
          type: 'string',
        },
      },
    },
    res_wobject_map_last_post: {
      type: 'object',
      properties: {
        hasMore: {
          type: 'boolean',
        },
        wobjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              author_permlink: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              address: {
                type: 'string',
              },
              defaultShowLink: {
                type: 'string',
              },
              default_name: {
                type: 'string',
              },
              object_type: {
                type: 'string',
              },
              post: {
                $ref: '#/definitions/post',
              },
            },
          },
        },
      },
    },
    res_wobject_campaign_required: {
      type: 'object',
      properties: {
        hasMore: {
          type: 'boolean',
        },
        wobjects: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
      },
    },
    params_wobject_map_experts: {
      type: 'object',
      properties: {
        box: {
          $ref: '#/definitions/box_params',
        },
        skip: {
          type: 'number',
        },
        limit: {
          type: 'number',
        },
      },
    },
    params_wobject_campaign_required: {
      type: 'object',
      properties: {
        skip: {
          type: 'number',
        },
        limit: {
          type: 'number',
        },
        requiredObject: {
          type: 'string',
        },
      },
    },
    res_wobject_map_experts: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              followers_count: {
                type: 'number',
              },
              weight: {
                type: 'number',
              },
              followsYou: {
                type: 'boolean',
              },
              youFollows: {
                type: 'boolean',
              },
            },
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    box_params: {
      type: 'object',
      properties: {
        topPoint: {
          type: 'array',
          example: [
            -91.479002,
            68.117143,
          ],
        },
        bottomPoint: {
          type: 'array',
          example: [
            -131.139244,
            49.152501,
          ],
        },
      },
    },
    inline_response_200_17: {
      type: 'object',
      properties: {
        author_permlink: {
          type: 'string',
        },
        weight: {
          type: 'integer',
        },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
      },
    },
    params_12: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
        },
        skip: {
          type: 'number',
        },
      },
    },
    inline_response_200_18: {
      type: 'object',
      properties: {
        feed_price: {
          type: 'object',
          properties: {},
        },
        props: {
          type: 'object',
          properties: {},
        },
        tags: {
          type: 'object',
          properties: {},
        },
        accounts: {
          type: 'object',
          properties: {},
        },
        content: {
          type: 'object',
          properties: {},
        },
        tag_idx: {
          type: 'object',
          properties: {},
        },
        discussion_idx: {
          type: 'object',
          properties: {},
        },
      },
    },
    params_13: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        category: {
          type: 'string',
        },
      },
    },
    params_14: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
        wobjects_count: {
          type: 'integer',
        },
      },
    },
    params_15: {
      type: 'object',
      properties: {
        userName: {
          type: 'string',
        },
        wobjects_count: {
          type: 'integer',
        },
        wobjects_skip: {
          type: 'integer',
        },
        filter: {
          $ref: '#/definitions/apiobjectTypename_filter',
        },
        sort: {
          type: 'string',
        },
        simplified: {
          type: 'boolean',
        },
      },
    },
    params_16: {
      type: 'object',
      properties: {
        search_string: {
          type: 'string',
        },
        limit: {
          type: 'integer',
        },
        skip: {
          type: 'integer',
        },
      },
    },
    params_17: {
      type: 'object',
      properties: {
        string: {
          type: 'string',
        },
        userLimit: {
          type: 'integer',
        },
        wobjectsLimit: {
          type: 'integer',
        },
        objectTypesLimit: {
          type: 'integer',
        },
        sortByApp: {
          type: 'string',
        },
        onlyObjectTypes: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    params_18: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          followers_count: {
            type: 'number',
          },
          wobjects_weight: {
            type: 'number',
          },
          blockedBy: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
    params_20: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          author: {
            type: 'string',
          },
          permlink: {
            type: 'string',
          },
        },
      },
    },
    inline_response_200_19: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        related_wobjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
      },
    },
    apiobjectTypename_filter: {
      type: 'object',
      properties: {
        map: {
          $ref: '#/definitions/apiwobject_map',
        },
      },
    },
    inline_response_200_20_filters: {
      type: 'object',
      properties: {
        map: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    inline_response_200_20: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
        related_wobjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        hasMoreWobjects: {
          type: 'boolean',
        },
        filters: {
          $ref: '#/definitions/inline_response_200_20_filters',
        },
      },
    },
    inline_response_200_21: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        weight: {
          type: 'number',
        },
      },
    },
    inline_response_200_22: {
      type: 'object',
      properties: {
        wobjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        objectTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        accounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
      },
    },
    inline_response_200_23_moderators: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        author_permlinks: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    inline_response_200_23_supported_object_types: {
      type: 'object',
      properties: {
        object_type: {
          type: 'string',
        },
        required_fields: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    inline_response_200_23_daily_chosen_post: {
      type: 'object',
      properties: {
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
      },
    },
    inline_response_200_23: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        admins: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        moderators: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200_23_moderators',
          },
        },
        supported_object_types: {
          type: 'array',
          items: {
            $ref: '#/definitions/inline_response_200_23_supported_object_types',
          },
        },
        supported_objects: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        daily_chosen_post: {
          $ref: '#/definitions/inline_response_200_23_daily_chosen_post',
        },
        weekly_chosen_post: {
          $ref: '#/definitions/inline_response_200_23_daily_chosen_post',
        },
      },
    },
    wobjectonlist_users: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        profile_image: {
          type: 'string',
        },
        weight: {
          type: 'number',
        },
      },
    },
    post_active_votes: {
      type: 'object',
      properties: {
        voter: {
          type: 'string',
        },
        weight: {
          type: 'integer',
        },
        perent: {
          type: 'integer',
        },
      },
    },
    userMetadata_user_metadata_settings: {
      type: 'object',
      properties: {
        exitPageSetting: {
          type: 'boolean',
        },
        locale: {
          type: 'string',
        },
        postLocales: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        nightmode: {
          type: 'boolean',
        },
        rewardSetting: {
          type: 'string',
        },
        rewriteLinks: {
          type: 'boolean',
        },
        showNSFWPosts: {
          type: 'boolean',
        },
        upvoteSetting: {
          type: 'boolean',
        },
        votePercent: {
          type: 'number',
        },
        votingPower: {
          type: 'boolean',
        },
        currency: {
          type: 'string',
          example: 'USD',
          enum: [
            'USD',
            'CAD',
          ],
        },
      },
    },
    userMetadata_user_metadata: {
      type: 'object',
      properties: {
        notifications_last_timestamp: {
          type: 'number',
        },
        bookmarks: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        drafts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        canMute: {
          type: 'boolean',
        },
        settings: {
          $ref: '#/definitions/userMetadata_user_metadata_settings',
        },
      },
    },
    objectTypeParam: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          enum: [
            'restaurant',
            'dish',
            'drink',
          ],
        },
      },
    },
    wobjCountersByArea: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            example: 'Vancouver',
          },
          route: {
            type: 'string',
            example: 'center=49.25997734756513%2C-123.16840544074762&zoom=13',
          },
          counter: {
            type: 'number',
            example: 2135,
          },
        },
      },
    },
    prefetch_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Vancouver Restaurants',
        },
        tag: {
          type: 'string',
          example: 'italian',
        },
        type: {
          type: 'string',
          enum: [
            'restaurant',
            'dish',
            'drink',
          ],
        },
        category: {
          type: 'string',
          enum: [
            'Cuisine',
            'Features',
            'Good+For',
            'Ingredients',
            'Category',
          ],
        },
        image: {
          type: 'string',
          description: 'link to the uploaded image',
          example: 'https://images.unsplash.com/photo-1546549032-9571c=crop&w=334&q=80',
        },
      },
    },
    created_prefetch_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Vancouver Restaurants',
        },
        tag: {
          type: 'string',
          example: 'italian',
        },
        type: {
          type: 'string',
          enum: [
            'restaurant',
            'dish',
            'drink',
          ],
        },
        category: {
          type: 'string',
          enum: [
            'Cuisine',
            'Features',
            'Good+For',
            'Ingredients',
            'Category',
          ],
        },
        image: {
          type: 'string',
          description: 'link to the uploaded image',
          example: 'https://waivio.nyc3.digitaloceanspaces.com/photo-1546549032-9571c=crop&w=334&q=80',
        },
        route: {
          type: 'string',
          description: 'prepared route for searching on the map',
          example: 'type=restaurant&Cuisine=italian',
        },
      },
    },
    wobjects_nearby_metadata: {
      type: 'object',
      properties: {
        wobjects: {
          type: 'array',
          items: {
            $ref: '#/definitions/wobjectonlist',
          },
        },
      },
    },
    shop_filter: {
      type: 'object',
      properties: {
        rating: {
          type: 'number',
        },
        tagCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryName: {
                type: 'string',
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    shop_object_feed: {
      type: 'object',
      properties: {
        wobjects: {
          type: 'array',
          items: {
            $ref: '#/definitions/wobject',
          },
        },
        department: {
          type: 'string',
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    tagCategory_response: {
      type: 'object',
      properties: {
        tagCategory: {
          type: 'string',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        hasMore: {
          type: 'boolean',
        },
      },
    },
    shop_filter_resp: {
      type: 'object',
      properties: {
        rating: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        tagCategory: {
          type: 'array',
          items: {
            $ref: '#/definitions/tagCategory_response',
          },
        },
      },
    },
    departments_response: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        subdirectory: {
          type: 'boolean',
        },
        related: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    ad_sense: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
        },
        code: {
          type: 'string',
        },
      },
    },
    affiliate_list: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
        },
        countryCode: {
          type: 'string',
        },
        type: {
          type: 'string',
        },
        affiliateCode: {
          type: 'string',
        },
      },
    },
    advancedReportParams: {
      type: 'object',
      properties: {
        accounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'blauser',
              },
              lastId: {
                type: 'string',
                example: '627d9aa9a72924295ebcff0e',
              },
            },
          },
        },
        filterAccounts: {
          type: 'array',
          items: {
            type: 'string',
            example: 'blaster',
          },
        },
        startDate: {
          type: 'number',
          example: 1619816400,
        },
        endDate: {
          type: 'number',
          example: 1621857636,
        },
        limit: {
          type: 'number',
        },
        user: {
          type: 'string',
          example: 'blauser',
        },
        currency: {
          type: 'string',
          example: 'UAH',
        },
        symbol: {
          type: 'string',
          example: 'WAIV',
        },
      },
    },
    engineReportWallet: {
      type: 'object',
      properties: {
        account: {
          type: 'string',
        },
        symbol: {
          type: 'string',
        },
        operation: {
          type: 'string',
        },
        transactionId: {
          type: 'string',
        },
        _id: {
          type: 'string',
        },
        timestamp: {
          type: 'number',
        },
        blockNumber: {
          type: 'number',
        },
        checked: {
          type: 'boolean',
        },
      },
    },
    withdrawHiveTransaction: {
      type: 'object',
      properties: {
        account: {
          type: 'string',
        },
        inputCoinType: {
          type: 'string',
        },
        outputCoinType: {
          type: 'string',
        },
        amount: {
          type: 'number',
          format: 'float',
        },
        outputAmount: {
          type: 'number',
          format: 'float',
        },
        status: {
          type: 'string',
        },
        address: {
          type: 'string',
        },
        memo: {
          type: 'string',
        },
        usdValue: {
          type: 'number',
          format: 'float',
        },
        commission: {
          type: 'number',
          format: 'float',
        },
        receiver: {
          type: 'string',
        },
        transactionId: {
          type: 'string',
        },
        transactionHash: {
          type: ['string', 'null'],
        },
        exchangeId: {
          type: 'string',
        },
      },
      required: [
        'account',
        'inputCoinType',
        'outputCoinType',
        'amount',
        'outputAmount',
        'status',
        'address',
        'usdValue',
        'receiver',
        'transactionId',
        'exchangeId',
      ],
    },
    engineReportStatus: {
      type: 'object',
      properties: {
        reportId: {
          type: 'string',
        },
        user: {
          type: 'string',
        },
        currency: {
          type: 'string',
        },
        startDate: {
          type: 'string',
        },
        endDate: {
          type: 'string',
        },
        filterAccounts: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        accounts: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        deposits: {
          type: 'string',
        },
        withdrawals: {
          type: 'string',
        },
        status: {
          type: 'string',
        },
      },
    },
  },
};
