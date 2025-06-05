module.exports = {
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
  '/api/admins/sites/credits': {
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
                  $ref: '#/definitions/WebsitePayments',
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
  '/api/admins/sites/subscriptions': {
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
              type: 'object',
              properties: {
                userName: {
                  type: 'string',
                },
                host: {
                  type: 'string',
                },
                status: {
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
  '/api/admins/statistics/report': {
    post: {
      tags: ['admins'],
      description: 'get statistic reports',
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
              host: {
                type: 'string',
              },
              startDate: {
                type: 'string',
              },
              endDate: {
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
                    host: {
                      type: 'string',
                    },
                    visits: {
                      type: 'number',
                    },
                    buyAction: {
                      type: 'number',
                    },
                    buyActionUniq: {
                      type: 'number',
                    },
                    conversion: {
                      type: 'number',
                    },
                    createdAt: {
                      type: 'string',
                    },
                    updatedAt: {
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
  '/api/admins/guests/users': {
    post: {
      tags: ['admins'],
      description: 'Get guest users list',
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
              skip: {
                type: 'number',
              },
              limit: {
                type: 'number',
              },
              searchString: {
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
                  properties: {
                    name: { type: 'string' },
                    alias: { type: 'string' },
                    last_posts_count: { type: 'number' },
                    followers_count: { type: 'number' },
                    wobjects_weight: { type: 'number' },
                    last_root_post: { type: 'string' },
                    posting_json_metadata: { type: 'string' },
                    blocked: { type: 'boolean' },
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
  '/api/admins/guests/spam': {
    post: {
      tags: ['admins'],
      description: 'Get guest users spam list',
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
              skip: {
                type: 'number',
              },
              limit: {
                type: 'number',
              },
              searchString: {
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
                  properties: {
                    name: { type: 'string' },
                    alias: { type: 'string' },
                    last_posts_count: { type: 'number' },
                    followers_count: { type: 'number' },
                    wobjects_weight: { type: 'number' },
                    last_root_post: { type: 'string' },
                    posting_json_metadata: { type: 'string' },
                    blocked: { type: 'boolean' },
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
  '/api/admins/guests/spam/{name}': {
    post: {
      tags: ['admins'],
      description: 'Get guest user spam details',
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
          name: 'name',
          in: 'path',
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
              spam: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    account: { type: 'string' },
                    body: { type: 'string' },
                    reason: { type: 'string' },
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
  '/api/admins/guests/block': {
    post: {
      tags: ['admins'],
      description: 'Block guest user',
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
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  alias: { type: 'string' },
                  last_posts_count: { type: 'number' },
                  followers_count: { type: 'number' },
                  wobjects_weight: { type: 'number' },
                  last_root_post: { type: 'string' },
                  posting_json_metadata: { type: 'string' },
                  blocked: { type: 'boolean' },
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
};
