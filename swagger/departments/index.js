module.exports = {
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
};
