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
          }
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
};
