module.exports = {
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
};
