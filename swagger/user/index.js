module.exports = {
  '/api/users': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get all users objects info',
      description: 'Return list users sorting by summary weight in all wobjects',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'count of users to return',
          required: false,
          type: 'number',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'count of users to skip(for infinite scroll)',
          required: false,
          type: 'number',
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
        {
          name: 'sample',
          in: 'query',
          description: 'flag to return random 5 users from TOP 100(limit and skip in this case ignored)',
          required: false,
          type: 'boolean',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/inline_response_200',
            },
          },
        },
      },
    },
  },
  '/api/user/:userName/userMetadata': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get user metadata',
      description: 'Get user metadata, which includes private info(ex. settings, drafts etc.)',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'Name of waivio user',
          required: true,
          type: 'string',
        },
        {
          name: 'access-token',
          in: 'header',
          description: 'SteemConnect Access Token to identify user identity',
          required: false,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/userMetadata',
          },
        },
        401: {
          description: 'Unuthorized, token missing or invalid!',
        },
      },
    },
    put: {
      tags: [
        'user',
      ],
      summary: 'Update user metadata',
      description: 'Update user metadata, which includes private info(ex. settings, drafts etc.)',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'Name of waivio user',
          required: true,
          type: 'string',
        },
        {
          name: 'access-token',
          in: 'header',
          description: 'SteemConnect Access Token to identify user identity',
          required: false,
          type: 'string',
        },
        {
          in: 'body',
          name: 'data',
          description: 'data',
          required: false,
          schema: {
            $ref: '#/definitions/userMetadata',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/userMetadata',
          },
        },
        401: {
          description: 'Unuthorized, token missing or invalid!',
        },
      },
    },
  },
  '/api/user/getUsersData': {
    post: {
      tags: [
        'user',
      ],
      summary: 'Return aray of users accounts data',
      description: 'Return aray of users accounts data with flad hasMOre\n',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          in: 'body',
          name: 'params',
          description: 'List of user names',
          required: false,
          schema: {
            $ref: '#/definitions/params',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/inline_response_200_1',
          },
        },
      },
    },
  },
  '/api/user/{username}': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get user info',
      description: 'Return info about specified user from database and blockchain',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'username',
          in: 'path',
          description: 'Name of user to return',
          required: true,
          type: 'string',
        },
        {
          name: 'with_followings',
          in: 'query',
          description: 'Flag to include/exclude lists of followings users/objects',
          required: false,
          type: 'boolean',
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
            $ref: '#/definitions/User',
          },
        },
      },
    },
  },
  '/api/user/{userName}/guest-wallet': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get guest user wallet',
      description: 'Return wallet history',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'Name of user to return',
          required: true,
          type: 'string',
        },
        {
          name: 'symbol',
          in: 'query',
          description: 'wallet symbol example WAIV',
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
              history: {
                type: 'array',
                items: {
                  $ref: '#/definitions/guest_wallet',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/user/{userName}/guest-balance': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get guest user wallet',
      description: 'Return wallet history',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'Name of user to return',
          required: true,
          type: 'string',
        },
        {
          name: 'symbol',
          in: 'query',
          description: 'wallet symbol example WAIV',
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
              symbol: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  '/api/user/{userName}/guest-mana': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get guest user mana in percent',
      description: 'Return wallet history',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
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
                type: 'number',
              },
            },
          },
        },
      },
    },
  },
  '/api/user/{username}/setState': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Set new_usew marker to false',
      description: 'set user marker to false for disable new user modal window',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'username',
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
            $ref: '#/definitions/inline_response_200_2',
          },
        },
      },
    },
  },
  '/api/user/{username}/delegation': {
    get: {
      tags: [
        'user',
      ],
      summary: 'get Delegation history',
      description: 'get Delegation history of account',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'username',
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
            $ref: '#/definitions/delegation_response_200',
          },
        },
      },
    },
  },
  '/api/user/{username}/getFollowingsState': {
    get: {
      deprecated: true,
      tags: [
        'user',
      ],
      summary: 'Check user followings',
      description: 'Return array with names of users and boolean markers for each',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'username',
          in: 'path',
          description: 'Name of user to return',
          required: true,
          type: 'string',
        },
        {
          name: 'users',
          in: 'query',
          description: 'array of users which you want to check',
          required: false,
          type: 'array',
          items: {
            type: 'string',
          },
          collectionFormat: 'multi',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/inline_response_200_3',
            },
          },
        },
      },
    },
  },
  '/api/users/search': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Search users by name',
      description: 'Search users by name with param "limit"',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'searchString',
          in: 'query',
          description: 'String to search, when no search string returns top users by wobjects_weight',
          required: false,
          type: 'string',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number to indicate count of returning users',
          required: false,
          type: 'number',
          default: 20.0,
        },
        {
          name: 'skip',
          in: 'query',
          description: 'Number to indicate count of skip users',
          required: false,
          type: 'number',
          default: 0,
        },
        {
          name: 'notGuest',
          in: 'query',
          description: 'Flag for search only hive users',
          required: false,
          type: 'boolean',
          default: false,
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  $ref: '#/definitions/inline_response_200_4',
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
  '/api/users/search/host': {
    post: {
      tags: [
        'user',
      ],
      summary: 'Search users by name and host',
      description: 'Search users by name with param "limit"',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'searchString',
          in: 'body',
          description: 'String to search, when no search string returns top users by wobjects_weight',
          required: false,
          schema: {
            type: 'object',
            properties: {
              string: {
                type: 'string',
              },
              host: {
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
              users: {
                type: 'array',
                items: {
                  $ref: '#/definitions/inline_response_200_4',
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
  '/api/user/{userName}/following_objects': {
    post: {
      tags: [
        'user',
      ],
      summary: 'Return wobjects which user is following',
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
          name: 'userName',
          in: 'path',
          description: 'user name what objects needs to return',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: "**locale** - which locale need to choose field of each wobject(*'en-US' by default*), \n**limit** - limit of returned objects*(by default - 50)*, \n**skip** - skip some objects to return(params for infinite scroll, *by default - 0*)\n",
          required: false,
          schema: {
            $ref: '#/definitions/params_1',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/inline_response_200_5',
            },
          },
        },
      },
    },
  },
  '/api/user/{userName}/following_users': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Return users which user is following',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'user name which followings needs to return',
          required: true,
          type: 'string',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'Count users to skip(infinite scroll)',
          required: false,
          type: 'integer',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Count of users to return',
          required: false,
          type: 'integer',
        },
        {
          name: 'sort',
          in: 'query',
          description: 'How to sort users',
          required: false,
          default: 'rank',
          enum: [
            'rank',
            'alphabet',
            'followers',
            'recency',
          ],
          type: 'string',
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
            $ref: '#/definitions/inline_response_200_6',
          },
        },
      },
    },
  },
  '/api/user/{userName}/feed': {
    post: {
      tags: [
        'user',
      ],
      summary: 'Get user FEED',
      description: 'Get list posts depends on user followings (on users and wobjects)',
      parameters: [
        {
          name: 'follower',
          in: 'header',
          description: 'Name of user to check following',
          required: false,
          type: 'string',
        },
        {
          name: 'userName',
          in: 'path',
          description: 'user name what feed needs to return',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - limit of returned posts*(by default - 20)*, \n**user_languages** - array of languages to return feed\n----------------Infinite scroll---------------\n*For infinite scroll, use **skip** or **lastId** param, preferably **lastId** *\n**skip** - count of skipping posts*(by default - 0)*,\n**lastId** - *_id* of last retrieved post',
          required: false,
          schema: {
            $ref: '#/definitions/params_3',
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
  '/api/user/{userName}/objects_shares': {
    post: {
      tags: [
        'user',
      ],
      summary: 'Return all wobjects in which user has weight',
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
          name: 'userName',
          in: 'path',
          description: 'user name what objects needs to return',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - limit of returned wobjects(for infinite scroll)*(by default - 30)*, \n**skip** - count of skipping wobjects(for infinite scroll)*(by default - 0)*,\n**locale** - locale which wobjects fields need to return,\n**object_types** -types of objects to return,\n**exclude_object_types** - which types esclude from list to return,\n',
          required: false,
          schema: {
            $ref: '#/definitions/params_4',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/inline_response_200_7',
          },
        },
      },
    },
  },
  '/api/user/{userName}/expertise-counters': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Return users expertise-counters',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'user name which expertise-counters needs to return',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            properties: {
              hashtagsExpCount: {
                type: 'integer',
              },
              wobjectsExpCount: {
                type: 'integer',
              },
            },
          },
        },
      },
    },
  },
  '/api/user/{userName}/blog': {
    post: {
      tags: [
        'user',
      ],
      summary: 'Return user Blog(user authored and resteemed posts)',
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
          name: 'userName',
          in: 'path',
          description: 'user name which blog needs to return',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - count of posts to return(for infinite scroll)*(by default - 20)*,\n**skip** - count of posts to skip(need for infinite scroll)*(by default - 0)*,\n**tagsArray** - condition to filtering posts by tags (array author_permlink).\n',
          required: false,
          schema: {
            $ref: '#/definitions/params_5',
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
  '/api/user/{userName}/blog-tags': {
    post: {
      tags: [
        'user',
      ],
      summary: 'Return user blog tags',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'user name which tags needs to return',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - count of posts to return(for infinite scroll)*(by default - 20)*,\n**skip** - count of posts to skip(need for infinite scroll)*(by default - 0)*',
          required: false,
          schema: {
            type: 'object',
            properties: {
              skip: {
                type: 'number',
                default: 0,
              },
              limit: {
                type: 'number',
                default: 20,
              },
              checkedTags: {
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
              tags: {
                type: 'array',
                items: {
                  $ref: '#/definitions/postTags',
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
  '/api/user/{userName}/comments': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Return array of user comments(valid request for ordinary and guest users)',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'user name',
          required: true,
          type: 'string',
        },
        {
          name: 'start_permlink',
          in: 'query',
          description: 'permlink of last received comment(for infinite scroll)',
          required: false,
          type: 'string',
        },
        {
          name: 'follower',
          in: 'header',
          description: 'authorised user',
          required: false,
          type: 'string',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'count of comment to skip(for infinite scroll)',
          required: false,
          type: 'number',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'count of comments to skip',
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
              type: 'object',
              properties: {},
            },
          },
        },
      },
    },
  },
  '/api/user/{userName}/followers': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Return array of users which now follow current user',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'User name',
          required: true,
          type: 'string',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'count of users to return*(by default - 30)*',
          required: false,
          type: 'integer',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'count of users to skip(need for infinite scroll)*(by default - 0)*',
          required: false,
          type: 'integer',
        },
        {
          name: 'sort',
          in: 'query',
          description: 'How to sort users',
          required: false,
          default: 'rank',
          enum: [
            'rank',
            'alphabet',
            'followers',
            'recency',
          ],
          type: 'string',
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
            $ref: '#/definitions/inline_response_200_8',
          },
        },
      },
    },
  },
  '/api/user/{username}/following_updates': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get user following updates summary',
      description: 'Return last updates(posts count) of following users and wobjects',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'username',
          in: 'path',
          description: 'Name of specified user',
          required: true,
          type: 'string',
        },
        {
          name: 'users_count',
          in: 'query',
          description: 'count of TOP users to return (sort by Waivio rate)',
          required: false,
          type: 'integer',
        },
        {
          name: 'wobjects_count',
          in: 'query',
          description: 'count of TOP wobjects to return (sort by current user expertize in wobj)',
          required: false,
          type: 'integer',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/inline_response_200_9',
          },
        },
      },
    },
  },
  '/api/user/{username}/following_users_updates': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get following users updates',
      description: 'Get updates(latest posts count) for following users',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'username',
          in: 'path',
          description: 'Name of user to return',
          required: true,
          type: 'string',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'count of users to return (sort by Waivio rate)',
          required: false,
          type: 'integer',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'count of users to skipping(for infinite scroll)',
          required: false,
          type: 'integer',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/inline_response_200_9_users_updates',
          },
        },
      },
    },
  },
  '/api/user/{username}/following_wobjects_updates': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get following wobjects updates',
      description: 'Return last updates(posts count) of following wobjects',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'username',
          in: 'path',
          description: 'Name of specified user',
          required: true,
          type: 'string',
        },
        {
          name: 'object_type',
          in: 'query',
          description: 'object type of wobjects to return',
          required: true,
          type: 'string',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'count of wobjects to return (sort by current user expertize in wobj)',
          required: false,
          type: 'integer',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'count of skipping wobjects (for infinite scroll)',
          required: false,
          type: 'integer',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/inline_response_200_10',
          },
        },
      },
    },
  },
  '/api/import_steem_user': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Import to DB info about user from STEEM',
      description: 'Create user in DB if it not exist, and import data from STEEM',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'query',
          description: 'Name of specified user',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/inline_response_200_11',
          },
        },
        400: {
          description: 'User already imported!',
          schema: {
            $ref: '#/definitions/inline_response_400',
          },
        },
        423: {
          description: 'User is being imported at the moment!',
          schema: {
            $ref: '#/definitions/inline_response_400',
          },
        },
        503: {
          description: 'Max number of users are importing at the moment!',
          schema: {
            $ref: '#/definitions/inline_response_400',
          },
        },
      },
    },
  },
  '/api/user/{userName}/vote-value': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Estimate user vote value',
      description: 'Estimate user vote value in HIVE or HBD',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'Name of user to calc vote value',
          required: true,
          type: 'string',
        },
        {
          name: 'weight',
          in: 'query',
          description: 'vote weight min 0 max 100',
          required: true,
          type: 'number',
        },
        {
          name: 'author',
          in: 'query',
          description: 'post author',
          required: true,
          type: 'string',
        },
        {
          name: 'permlink',
          in: 'query',
          description: 'post permlink',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
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
  '/api/user/{userName}/vote-value-info': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Estimate user vote value in HIVE and WAIV',
      description: 'Estimate user vote value in HIVE and WAIV',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'Name of user to calc vote value',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            properties: {
              estimatedHIVE: {
                type: 'number',
              },
              estimatedWAIV: {
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
  '/api/user/{userName}/waiv-vote': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Estimate user vote value',
      description: 'Estimate user vote value in HIVE or HBD',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'Name of user to calc vote value',
          required: true,
          type: 'string',
        },
        {
          name: 'weight',
          in: 'query',
          description: 'vote weight min 0 max 100',
          required: true,
          type: 'number',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
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
  '/api/user/{userName}/white-list-object': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Shows either user in white list for vote on updates',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'Name of user to calc vote value',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            properties: {
              result: {
                type: 'boolean',
              },
              minWeight: {
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
  '/api/user/{userName}/creation-date': {
    get: {
      tags: [
        'user',
      ],
      summary: 'return timestamp(ms) creation date of acc',
      description: 'return timestamp(ms) creation date of acc',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'user name',
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
              timestamp: {
                type: 'number',
                example: 1513391133,
              },
            },
          },
        },
        404: {
          description: 'Not Found',
          schema: {
            example: {
              message: 'Not Found',
            },
          },
        },
      },
    },
  },
  '/api/user/{userName}/last-activity': {
    get: {
      tags: [
        'user',
      ],
      summary: "returns user's last activity date",
      description: "returns timestamp of user's last activity date",
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'userName',
          in: 'path',
          description: 'user name',
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
              lastActivity: {
                type: 'string',
                example: '2022-05-05T19:55:33',
              },
            },
          },
        },
        404: {
          description: 'Not Found',
          schema: {
            example: {
              message: 'Not Found',
            },
          },
        },
      },
    },
  },
  '/api/user/advanced-report': {
    post: {
      tags: [
        'user',
      ],
      summary: 'Get all wallet info for user or multiple users',
      description: 'Return wallet, accounts skip limit properties,deposits, withdrawals and hasMore flag',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'params',
          in: 'body',
          description: 'filterAccounts - array of all requested accounts names\nNot required properties: startDate, endDate, limit, symbol, currency, user',
          schema: {
            $ref: '#/definitions/advancedReportParams',
          },
        },
      ],
      responses: {
        200: {
          description: 'ok',
          schema: {
            type: 'object',
            properties: {
              wallet: {
                type: 'array',
                items: {
                  $ref: '#/definitions/engineReportWallet',
                },
              },
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
              hasMore: {
                type: 'boolean',
              },
              deposits: {
                type: 'number',
              },
              withdrawals: {
                type: 'number',
              },
            },
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/user/advanced-report/generated': {
    post: {
      tags: [
        'user',
      ],
      summary: 'create new report task',
      description: 'create new report task',
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
          description: 'filterAccounts - array of all requested accounts names\nNot required properties: startDate, endDate, limit, symbol, currency, user',
          schema: {
            $ref: '#/definitions/advancedReportParams',
          },
        },
      ],
      responses: {
        200: {
          description: 'ok',
          schema: {
            $ref: '#/definitions/engineReportStatus',
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/user/advanced-report/generated/progress': {
    post: {
      tags: [
        'user',
      ],
      summary: 'get tasks in progress',
      description: 'get tasks in progress',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'params',
          in: 'body',
          schema: {
            type: 'object',
            properties: {
              user: {
                type: 'string',
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'ok',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/engineReportStatus',
            },
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/user/advanced-report/generated/history': {
    post: {
      tags: [
        'user',
      ],
      summary: 'get completed tasks',
      description: 'get completed tasks',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'params',
          in: 'body',
          schema: {
            type: 'object',
            properties: {
              user: {
                type: 'string',
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'ok',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/engineReportStatus',
            },
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/user/advanced-report/generated/record': {
    post: {
      tags: [
        'user',
      ],
      summary: 'exclude/include record in report',
      description: 'exclude/include record in report',
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
          schema: {
            type: 'object',
            properties: {
              user: {
                type: 'string',
              },
              reportId: {
                type: 'string',
              },
              _id: {
                type: 'string',
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'ok',
          schema: {
            $ref: '#/definitions/engineReportWallet',
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/user/advanced-report/generated/report': {
    post: {
      tags: [
        'user',
      ],
      summary: 'shows generated report',
      description: 'shows generated report',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'params',
          in: 'body',
          schema: {
            type: 'object',
            properties: {
              reportId: {
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
          description: 'ok',
          schema: {
            type: 'object',
            properties: {
              wallet: {
                $ref: '#/definitions/engineReportWallet',
              },
              hasMore: {
                type: 'boolean',
              },
            },
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/user/advanced-report/generated/resume': {
    post: {
      tags: [
        'user',
      ],
      summary: 'resume report',
      description: 'resume report',
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
          schema: {
            type: 'object',
            properties: {
              reportId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'ok',
          schema: {
            $ref: '#/definitions/engineReportStatus',
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/user/advanced-report/generated/stop': {
    post: {
      tags: [
        'user',
      ],
      summary: 'stop report',
      description: 'stop report',
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
          schema: {
            type: 'object',
            properties: {
              reportId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'ok',
          schema: {
            $ref: '#/definitions/engineReportStatus',
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/user/advanced-report/generated/pause': {
    post: {
      tags: [
        'user',
      ],
      summary: 'pause report',
      description: 'pause report',
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
          schema: {
            type: 'object',
            properties: {
              reportId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'ok',
          schema: {
            $ref: '#/definitions/engineReportStatus',
          },
        },
        422: {
          description: 'Unprocessable Entity',
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
  '/api/geo-ip': {
    get: {
      tags: [
        'user',
      ],
      summary: 'Get user coordinates by ip',
      description: 'Get user coordinates by ip',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'x-forwarded-for',
          in: 'header',
          description: 'ip header prod',
          required: false,
          type: 'string',
        },
        {
          name: 'x-real-ip',
          in: 'header',
          description: 'ip header staging',
          required: false,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            properties: {
              longitude: {
                type: 'number',
              },
              latitude: {
                type: 'number',
              },
            },
          },
        },
      },
    },
    put: {
      tags: [
        'user',
      ],
      summary: 'Set user coordinates by ip',
      description: 'Set user coordinates by ip,\n for this request get coordinate only from navigator',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'x-forwarded-for',
          in: 'header',
          description: 'ip header prod',
          required: false,
          type: 'string',
        },
        {
          name: 'x-real-ip',
          in: 'header',
          description: 'ip header staging',
          required: false,
          type: 'string',
        },
        {
          name: 'params',
          in: 'body',
          description: '**longitude** - double, range of values -180, 180\n**latitude** - double, range of values -90, 90',
          required: true,
          schema: {
            type: 'object',
            example: {
              longitude: 34.0954,
              latitude: 76.2323,
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            properties: {
              longitude: {
                type: 'number',
              },
              latitude: {
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
  '/api/user/{userName}/draft': {
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
  '/api/user/{userName}/draft/?{authorPermlink}': {
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
  '/api/users/rc-delegations/incoming': {
    get: {
      tags: ['user'],
      summary: 'get incoming rc delegations',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'delegatee',
          in: 'query',
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
              type: 'object',
              properties: {
                delegatee: {
                  type: 'string',
                },
                delegator: {
                  type: 'string',
                },
                rc: {
                  type: 'number',
                },
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
};
