module.exports = {
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
};
