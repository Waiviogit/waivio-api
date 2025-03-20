module.exports = {
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
  '/api/sites/paypal/subscription/basic': {
    post: {
      tags: [
        'sites',
      ],
      summary: 'create plan for subscription, return plan object with id use for subscription',
      description: 'create plan for subscription, return plan object with id use for subscription',
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
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                  },
                  product_id: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                  create_time: {
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
  '/api/sites/paypal/subscription/activation': {
    post: {
      tags: [
        'sites',
      ],
      summary: 'activate subscription with subscriptionId returns subscription object',
      description: 'activate subscription with subscriptionId returns subscription object',
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
              subscriptionId: {
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
                  id: {
                    type: 'string',
                  },
                  product_id: {
                    type: 'string',
                  },
                  plan_id: {
                    type: 'string',
                  },
                  status: {
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
  '/api/sites/paypal/subscription/id': {
    post: {
      tags: [
        'sites',
      ],
      summary: 'in case you need subscription id by host to cancel subscription',
      description: 'in case you need subscription id by host to cancel subscription',
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
  '/api/sites/paypal/subscription/details': {
    post: {
      tags: [
        'sites',
      ],
      summary: 'subscription details by host, returns subscription object',
      description: 'subscription details by host, returns subscription object',
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
      },
    },
  },
  '/api/sites/paypal/subscription/cancel': {
    post: {
      tags: [
        'sites',
      ],
      summary: 'subscription cancel',
      description: 'subscription cancel by host',
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
              reason: {
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
              },
            },
          },
        },
      },
    },
  },
};
