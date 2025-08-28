module.exports = {
  '/api/post/{author}/{permlink}': {
    get: {
      tags: [
        'post',
      ],
      summary: 'Return post details',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following',
          required: false,
          type: 'string',
        },
        {
          name: 'locale',
          in: 'header',
          description: 'User locale',
          required: false,
          type: 'string',
        },
        {
          name: 'author',
          in: 'path',
          description: 'Author of post',
          required: true,
          type: 'string',
        },
        {
          name: 'permlink',
          in: 'path',
          description: 'Permlink of post',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/post',
          },
        },
      },
    },
  },
  '/api/post_comments': {
    get: {
      tags: [
        'post',
      ],
      summary: 'Return post comments and other details. Comments placed at "content" key of result object.',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'author',
          in: 'query',
          description: 'Author of post',
          required: true,
          type: 'string',
        },
        {
          name: 'permlink',
          in: 'query',
          description: 'Permlink of post',
          required: true,
          type: 'string',
        },
        {
          name: 'category',
          in: 'query',
          description: 'Category of post, aka parent_permlink',
          required: true,
          type: 'string',
        },
        {
          name: 'userName',
          in: 'query',
          description: 'name of authorised user',
          required: false,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/inline_response_200_18',
          },
        },
      },
    },
  },
  '/api/posts': {
    post: {
      tags: [
        'post',
      ],
      summary: 'Return list of posts by some category(trending, hot, created, blog)',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following',
          required: false,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: "**limit** - Count of posts to return (*default* 30),\n**category** - Category of posts(trending, created, hot, blog, promoted).\n\n----------------Infinite scroll---------------\nFor infinite scroll, use **skip** or **lastId** param, for 'trending' and 'hot' - use **skip**, for 'created' - preferably **lastId**\n**skip** - count of skipping posts*(by default - 0)*,\n**lastId** - *_id* of last retrieved post",
          required: false,
          schema: {
            example: {
              limit: 10,
              category: 'created',
              lastId: '54745f3456a001010100',
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
              $ref: '#/definitions/post',
            },
          },
        },
      },
    },
  },
  '/api/posts/getMany': {
    post: {
      tags: [
        'post',
      ],
      summary: 'Return list of posts by authors and permlinks',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          in: 'body',
          name: 'params',
          description: 'Array of authors and permlinks',
          required: true,
          schema: {
            $ref: '#/definitions/params_20',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/post',
            },
          },
        },
      },
    },
  },
  '/api/posts/mentions': {
    post: {
      tags: [
        'post',
      ],
      summary: 'Return list of posts by authors and permlinks',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'follower',
          in: 'header',
          description: 'user currently logged in',
          required: false,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              account: {
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
              posts: {
                type: 'array',
                items: {
                  $ref: '#/definitions/post',
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
  '/api/posts/judge-posts': {
    post: {
      tags: [
        'post',
      ],
      summary: 'Return list of posts for a judge by author permlink',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'follower',
          in: 'header',
          description: 'user currently logged in',
          required: false,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              judgeName: {
                type: 'string',
                description: 'Name of the judge',
              },
              authorPermlink: {
                type: 'string',
                description: 'Author permlink to filter posts',
              },
              skip: {
                type: 'number',
                description: 'Number of posts to skip',
                default: 0,
              },
              limit: {
                type: 'number',
                description: 'Number of posts to return',
                default: 10,
              },
            },
            required: ['judgeName', 'authorPermlink'],
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              posts: {
                type: 'array',
                items: {
                  $ref: '#/definitions/post',
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
  '/api/posts/preview-cache': {
    post: {
      tags: [
        'post',
      ],
      summary: 'Return list of urls for tik-tok',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          in: 'body',
          name: 'params',
          description: 'Array of authors and permlinks',
          required: true,
          schema: {
            type: 'object',
            properties: {
              urls: {
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
                url: {
                  type: 'string',
                },
                urlPreview: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    put: {
      tags: [
        'post',
      ],
      summary: 'Put preview for tik-tok',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          in: 'body',
          name: 'params',
          description: 'Array of authors and permlinks',
          required: true,
          schema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
              },
              urlPreview: {
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
  '/api/post/social-info': {
    get: {
      tags: [
        'post',
      ],
      summary: 'Return list of posts by authors and permlinks',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          in: 'query',
          name: 'author',
          description: 'author of post',
          type: 'string',
          required: true,
        },
        {
          in: 'query',
          name: 'permlink',
          description: 'post permlink',
          type: 'string',
          required: true,
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              userFacebook: {
                type: 'string',
              },
              userTwitter: {
                type: 'string',
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              cities: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              wobjectsTwitter: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              wobjectsFacebook: {
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
        404: {
          description: 'NotFound',
          schema: {
            example: {
              message: 'Post not found',
            },
          },
        },
      },
    },
  },
  '/api/post/like-post': {
    post: {
      tags: [
        'post',
      ],
      summary: 'Return update post',
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
          in: 'body',
          name: 'params',
          description: '',
          required: true,
          schema: {
            example: {
              voter: 'krnel',
              author: 'johan-nygren',
              permlink: 'psychiatric-science-is-just-a-mythology-to-legitimize-human-ritual-sacrifice',
              weight: 5000,
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/post',
          },
        },
      },
    },
  },
};
