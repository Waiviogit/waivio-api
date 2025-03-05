module.exports = {
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
};
