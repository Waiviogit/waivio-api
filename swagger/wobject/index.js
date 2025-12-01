const { AUTH_HEADERS } = require('../headers');

module.exports = {
  '/api/wobjects/map/last-post': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return list of wobjects on area with last post',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - limit of returned users(by default - 30),\n**skip** - count of skipping users(for infinite scroll, default 0),\n**box** - map coordinates\n**objectType** -type of objects, default - restaurant',
          required: true,
          schema: {
            $ref: '#/definitions/params_wobject_map_last_post',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/res_wobject_map_last_post',
          },
        },
      },
    },
  },
  '/api/wobjects/map/experts': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return list of waivio expert on certain area',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for followers',
          required: false,
          type: 'string',
        },
        {
          name: 'following',
          in: 'header',
          description: 'Name of user to check for following',
          required: false,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - limit of returned users(by default - 30),\n**skip** - count of skipping users(for infinite scroll, default 0),\n**box** - map coordinates',
          required: true,
          schema: {
            $ref: '#/definitions/params_wobject_map_experts',
          },
        },
      ],
      responses: {
        200: {
          description: '**hasMore** - Boolean flag of of existing more wobjects,\n**wobjects** - array of Waivio objects\n',
          schema: {
            $ref: '#/definitions/res_wobject_map_experts',
          },
        },
      },
    },
  },
  '/api/wobjects/campaign/required-object': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return list of waivio expert on certain area',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - limit of returned users(by default - 30),\n**skip** - count of skipping users(for infinite scroll, default 0),\n**requiredObject** - primary object on campaign',
          required: true,
          schema: {
            $ref: '#/definitions/params_wobject_campaign_required',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/res_wobject_campaign_required',
          },
        },
      },
    },
  },
  '/api/wobjects/names': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return list of wobjects with names',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**links** - array of author_permlink',
          required: true,
          schema: {
            type: 'object',
            properties: {
              links: {
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
              wobjects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    author_permlink: {
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
  '/api/wobjects/options': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return list of wobjects on area with last post',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
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
              category: {
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
  '/api/wobjects/group-id': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return list of wobjects on area with last post',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          required: true,
          schema: {
            type: 'object',
            properties: {
              groupId: {
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
  '/api/wobjects/id-type': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return author_permlink if exist',
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
              id: {
                type: 'string',
              },
              idType: {
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
  '/api/wobjects/link/safety': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'checks link safety',
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
              url: {
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
              dangerous: {
                type: 'boolean',
              },
              linkWaivio: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  '/api/wobject': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return list of waivio objects, all or by specified author_permlink(author_permlink)',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - limit of returned wobjects(by default - 30),\n**skip** - count of skipping wobjects(for infinite scroll, default 0),\n**user_limit** - count of users to show(by default 5), \n**locale** - locale of fields(by default - *en-US*.), \n**author_permlinks** - return wobjects by specified author_permlinks,\n**object_types** - list object types with witch objects to returning,\n**exclude_object_types** - list object types without witch objects to returning, (if use **object_types** then ignore **exclude_object_types**)\n**required_fields** - which fields add to returning objects,\n**sample** - boolean flag, to return only 5 from top 100 wobjects\n**map** - object with coordinates and radius, need to display restaurants at map. Map includes property coordinates - it is array with numbers [longitude, latitude]\n',
          required: false,
          schema: {
            $ref: '#/definitions/params_6',
          },
        },
      ],
      responses: {
        200: {
          description: '**hasMore** - Boolean flag of of existing more wobjects,\n**wobjects** - array of Waivio objects\n',
          schema: {
            $ref: '#/definitions/inline_response_200_12',
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/getField': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return wobj field with data to show',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'wobject which field need to return',
          required: true,
          type: 'string',
        },
        {
          name: 'fieldName',
          in: 'query',
          description: 'name of field',
          required: true,
          type: 'string',
        },
        {
          name: 'fieldId',
          in: 'query',
          description: '_id of field',
          required: true,
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
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/wobjField',
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/authority-fields': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return wobj fields with authority',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'wobject which field need to return',
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
              $ref: '#/definitions/wobjField',
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return info about specified waivio object',
      description: 'A full description of possible keys with parameters can be found at https://github.com/Waiviogit/objects-bot/blob/master/docs/DetailsObjectFields.md',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following in wobjects',
          required: false,
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return',
          required: true,
          type: 'string',
        },
        {
          name: 'locale',
          in: 'header',
          description: 'Read locale of user(default en-EN)',
          required: false,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/wobject',
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/posts': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return posts for specified wobject',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following',
          required: false,
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return posts',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - Count of posts to return (*default* 30),\n**user_languages** - array of lanugages to filter result posts\n**newsPermlink** - string ( news filter permlink)\n\n----------------Infinite scroll---------------\n*For infinite scroll, use **skip** or **lastId** param, preferably **lastId** *\n**skip** - count of skipping posts*(by default - 0)*,\n**lastId** - *_id* of last retrieved post',
          required: false,
          schema: {
            $ref: '#/definitions/params_7',
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
  '/api/wobject/{authorPermlink}/pin': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return posts for specified wobject',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'locale',
          in: 'header',
          description: 'locale',
          required: false,
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following',
          required: false,
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return posts',
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
              $ref: '#/definitions/post',
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/newsfeed': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return posts for specified wobject newsfeed',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following',
          required: false,
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return posts',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - Count of posts to return (*default* 30),\n**user_languages** - array of lanugages to filter result posts\n**newsPermlink** - string ( news filter permlink)\n\n----------------Infinite scroll---------------\n*For infinite scroll, use **skip** or **lastId** param, preferably **lastId** *\n**skip** - count of skipping posts*(by default - 0)*,\n**lastId** - *_id* of last retrieved post',
          required: false,
          schema: {
            $ref: '#/definitions/params_7',
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
  '/api/wobject/{authorPermlink}/followers': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return followers for spicified wobject',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - count of followers to return(default 30), \n**skip** - count of followers that need to skip(for infinite scroll\n**sort** - How to sort followers. Available values : rank, alphabet, followers, recency)',
          required: false,
          schema: {
            $ref: '#/definitions/params_8',
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
            $ref: '#/definitions/inline_response_200_16_users3',
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/fields': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Returns all fields for spicified wobject',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
          type: 'string',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'skip',
          required: false,
          type: 'number',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'limit',
          required: false,
          type: 'number',
        },
        {
          name: 'type',
          in: 'query',
          description: 'limit',
          required: false,
          type: 'string',
        },
        {
          name: 'locale',
          in: 'query',
          description: 'limit',
          required: false,
          type: 'string',
        },
        {
          name: 'sort',
          in: 'query',
          description: 'sort',
          required: false,
          type: 'string',
          enum: [
            'approvePercent',
            'createdAt',
          ],
          default: 'createdAt',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              fields: {
                type: 'array',
                items: {
                  $ref: '#/definitions/inline_response_200_get_wobj_fields',
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
  '/api/wobject/{authorPermlink}/gallery': {
    get: {
      tags: [
        'wobject',
      ],
      summary: "Return all fields with name 'galleryItem'",
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
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
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
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
              $ref: '#/definitions/inline_response_200_15',
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/list': {
    get: {
      deprecated: true,
      tags: [
        'wobject',
      ],
      summary: "Return 'list' of specified waivio-wobject",
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
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
              $ref: '#/definitions/inline_response_200_12',
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/child_wobjects': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return child wobjects by current',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
          type: 'string',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'integer',
        },
        {
          name: 'skip',
          in: 'query',
          required: false,
          type: 'integer',
        },
        {
          name: 'excludeTypes',
          in: 'query',
          required: false,
          type: 'string',
        },
        {
          name: 'searchString',
          in: 'query',
          required: false,
          type: 'string',
        },
        {
          name: 'userName',
          in: 'query',
          required: false,
          type: 'string',
        },
        {
          name: 'locale',
          in: 'header',
          required: false,
          description: 'user locale for filling objects',
          default: 'en-US',
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
              properties: {},
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/nearby': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return objects that are nearby',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
          type: 'string',
        },
        {
          name: 'skip',
          in: 'query',
          required: false,
          minimum: 0,
          default: 0,
          type: 'integer',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          minimum: 1,
          maximum: 100,
          default: 5,
          type: 'integer',
        },
        {
          name: 'radius',
          in: 'query',
          required: false,
          minimum: 0,
          default: 20000,
          type: 'integer',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/wobjects_nearby_metadata',
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/object_expertise': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return all users which has weight in current wobject',
      produces: [
        'application/json5',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: "**limit** - Count of users to return (*default* 5), \n**skip** - count of skipping users(*default* 5), use for infinite scroll,\n**user** - UserName, which weight add to response\n, \n**newsFilter** - filter's permlink on which we will look for experts(*default* null), display experts by a specific filter",
          required: false,
          schema: {
            $ref: '#/definitions/params_10',
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
            $ref: '#/definitions/inline_response_200_16',
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/featured': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return featured objects',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
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
  '/api/wobjectSearch': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Search objects by prefix of "name" field',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**search_string** - pattern for search wobjects, \n**object_type** - filter to search only specified type,\n**locale** - locale for end formatting wobject fields(by default - en-US), \n**limit** - limit of returned wobjects,\n**skip** - count of skipping wobjects,\n**sortByApp** - change priority for cruical wobjects by specified App,\n**required_fields** - array of filds to include in result wobjects\n**tagCategory** - for filter by tags\n **userName** - name of user for fill campaigns \n **simplified** - flag for simplified response\n **map** -  object with coordinates and radius, need to display restaurants at map. Map includes property coordinates - it is array with numbers [longitude, latitude]\n **sort** - field for sort wobjects - valid: createdAt, weight, default - weight\n \n**topPoint** (it is array with numbers [longitude, latitude])- upper right coordinates \n **bottomPoint**(it is array with numbers [longitude, latitude]) - bottom left coordinates\n **addHashtag** - boolean - if true add hashtag on wobj search(for sites)',
          required: false,
          schema: {
            $ref: '#/definitions/params_11',
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
                  $ref: '#/definitions/inline_response_200_17',
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
  '/api/wobjects/search-default': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Search objects by prefix of "name" field',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**search_string** - pattern for search wobjects, \n**object_type** - filter to search only specified type,\n**locale** - locale for end formatting wobject fields(by default - en-US), \n**limit** - limit of returned wobjects,\n**skip** - count of skipping wobjects,\n**sortByApp** - change priority for cruical wobjects by specified App,\n**required_fields** - array of filds to include in result wobjects\n**tagCategory** - for filter by tags\n **userName** - name of user for fill campaigns \n **simplified** - flag for simplified response\n **map** -  object with coordinates and radius, need to display restaurants at map. Map includes property coordinates - it is array with numbers [longitude, latitude]\n **sort** - field for sort wobjects - valid: createdAt, weight, default - weight\n \n**topPoint** (it is array with numbers [longitude, latitude])- upper right coordinates \n **bottomPoint**(it is array with numbers [longitude, latitude]) - bottom left coordinates\n **addHashtag** - boolean - if true add hashtag on wobj search(for sites)',
          required: false,
          schema: {
            $ref: '#/definitions/params_11',
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
                  $ref: '#/definitions/inline_response_200_17',
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
  '/api/wobjectsFeed': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return feed of all wobjects togetger',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - Count of posts to return (*default* 30), \n**skip** - Count of skipping posts infinite scroll(*optional*)\n',
          required: false,
          schema: {
            $ref: '#/definitions/params_12',
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
              properties: {},
            },
          },
        },
      },
    },
  },
  '/api/wobjectsByField': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return array of wobjects by specified field entry',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'fieldName',
          in: 'query',
          description: 'Name of field',
          required: true,
          type: 'string',
        },
        {
          name: 'fieldBody',
          in: 'query',
          description: 'Value of field',
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
              $ref: '#/definitions/wobject',
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/related': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return virtual album Related',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
          type: 'string',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'integer',
        },
        {
          name: 'skip',
          in: 'query',
          required: false,
          type: 'integer',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              body: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              id: {
                type: 'string',
              },
              count: {
                type: 'number',
              },
              hasMore: {
                type: 'boolean',
              },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    permlink: {
                      type: 'string',
                    },
                    id: {
                      type: 'string',
                    },
                    body: {
                      type: 'string',
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
  },
  '/api/wobject/count/by-area': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return array of wobjects with counters',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'objectType',
          in: 'query',
          description: 'object type of wobjects to return',
          required: true,
          type: 'string',
          enum: [
            'restaurant',
            'dish',
            'drink',
          ],
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/wobjCountersByArea',
          },
        },
        404: {
          description: 'Return error if cities not specify in app',
          schema: {
            example: {
              message: 'Cities not specified!',
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/exist': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return true or false to show if object exists',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
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
              exist: {
                type: 'boolean',
              },
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/list-item-locales/{itemLink}': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return array of locales',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
          type: 'string',
        },
        {
          name: 'itemLink',
          in: 'path',
          description: 'author_permlink of list item',
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
      },
    },
  },
  '/api/wobject/{authorPermlink}/map': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return objects from object_type map',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following in wobjects',
          required: false,
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return',
          required: true,
          type: 'string',
        },
        {
          name: 'locale',
          in: 'header',
          description: 'Read locale of user(default en-EN)',
          required: false,
          type: 'string',
        },
        {
          name: 'params',
          in: 'body',
          schema: {
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
                  $ref: '#/definitions/wobject',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/map/list': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return objects from object_type map',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following in wobjects',
          required: false,
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return',
          required: true,
          type: 'string',
        },
        {
          name: 'locale',
          in: 'header',
          description: 'Read locale of user(default en-EN)',
          required: false,
          type: 'string',
        },
        {
          name: 'params',
          in: 'body',
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
              result: {
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
    },
  },
  '/api/wobject/{authorPermlink}/map-link': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'Return objects from object_type map',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check for following in wobjects',
          required: false,
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return',
          required: true,
          type: 'string',
        },
        {
          name: 'locale',
          in: 'header',
          description: 'Read locale of user(default en-EN)',
          required: false,
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
  '/api/wobject/{authorPermlink}/raw-field': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return objects from object_type map',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
          type: 'string',
        },
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return',
          required: true,
          type: 'string',
        },
        {
          name: 'locale',
          in: 'header',
          description: 'Read locale of user(default en-EN)',
          required: false,
          type: 'string',
        },
        {
          name: 'params',
          in: 'body',
          schema: {
            type: 'object',
            properties: {
              body: {
                type: 'string',
              },
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
            $ref: '#/definitions/raw_field',
          },
        },
        404: {
          description: 'Not Found',
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/instacart-link': {
    get: {
      tags: [
        'wobject',
      ],
      summary: 'get link for instacart',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of object to return',
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
        404: {
          description: 'Not Found',
        },
        422: {
          description: 'Unprocessable',
        },
      },
    },
  },
  '/api/wobjects/group': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Search objects by prefix of "name" field',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          in: 'body',
          name: 'params',
          description: '**search_string** - pattern for search wobjects, \n**object_type** - filter to search only specified type,\n**locale** - locale for end formatting wobject fields(by default - en-US), \n**limit** - limit of returned wobjects,\n**skip** - count of skipping wobjects,\n**sortByApp** - change priority for cruical wobjects by specified App,\n**required_fields** - array of filds to include in result wobjects\n**tagCategory** - for filter by tags\n **userName** - name of user for fill campaigns \n **simplified** - flag for simplified response\n **map** -  object with coordinates and radius, need to display restaurants at map. Map includes property coordinates - it is array with numbers [longitude, latitude]\n **sort** - field for sort wobjects - valid: createdAt, weight, default - weight\n \n**topPoint** (it is array with numbers [longitude, latitude])- upper right coordinates \n **bottomPoint**(it is array with numbers [longitude, latitude]) - bottom left coordinates\n **addHashtag** - boolean - if true add hashtag on wobj search(for sites)',
          required: false,
          schema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
              },
              authorPermlink: {
                type: 'string',
              },
              lastName: {
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
                    name: {
                      type: 'string',
                    },
                    last_posts_count: {
                      type: 'number',
                    },
                    followers_count: {
                      type: 'number',
                    },
                    wobjects_weight: {
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
  '/api/wobjects/active-campaigns': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Return list of wobjects with active campaigns',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Access-Host',
          in: 'header',
          description: 'To get the object as it appears on the desired site, add the host to this header. \n No need to add https://',
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
            $ref: '#/definitions/inline_response_200_12',
          },
        },
      },
    },
  },
  '/api/wobject/{authorPermlink}/vote-field': {
    post: {
      tags: [
        'wobject',
      ],
      summary: 'Vote on wobject field update',
      produces: [
        'application/json',
      ],
      parameters: [
        ...AUTH_HEADERS,
        {
          name: 'authorPermlink',
          in: 'path',
          description: 'author_permlink of specified wobject',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: 'Vote parameters for field update',
          required: true,
          schema: {
            type: 'object',
            properties: {
              author: {
                type: 'string',
                description: 'Author of the field update',
              },
              permlink: {
                type: 'string',
                description: 'Permlink of the field update',
              },
              voter: {
                type: 'string',
                description: 'Name of the voter',
              },
              weight: {
                type: 'number',
                description: 'Vote weight (0 to 10000)',
                minimum: 0,
                maximum: 10000,
              },
            },
            required: ['author', 'permlink', 'voter', 'weight'],
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/voteFieldResponse',
          },
        },
        400: {
          description: 'Bad Request',
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
};
