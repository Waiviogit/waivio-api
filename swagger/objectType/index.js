module.exports = {
  '/api/objectTypes': {
    post: {
      tags: [
        'object_type',
      ],
      summary: 'Return list of Object Types',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'app',
          in: 'header',
          description: 'Specify app to enable waivio-wobject moderation',
          required: false,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**limit** - Count of object_typs to return (*default* 30),\n**skip** - Count of skipping object_type(for infinite scroll),\n**wobjects_count** - Count of related wobjects to return(default 3)\n',
          required: false,
          schema: {
            $ref: '#/definitions/params_14',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/inline_response_200_19',
            },
          },
        },
      },
    },
  },
  '/api/objectType/{name}': {
    post: {
      tags: [
        'object_type',
      ],
      summary: 'Return Object Type details',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'app',
          in: 'header',
          description: 'Specify app to enable waivio-wobject moderation',
          required: false,
          type: 'string',
        },
        {
          name: 'name',
          in: 'path',
          description: 'Name of Object Type',
          required: true,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**simplified** - boolean flag for simply result for map\n**userName** - name of user, who make request\n**wobjects_count** - Count of wobjects to return (*default* 30),\n**wobjects_skip** - Count of skipping object(for infinite scroll),\n**filter** - advanced filter for *wobjects* current *Object Type*,\n**filter.map** - composite param, to find wobjects in radius\n**filter.map.coordinates** - coordinates of point to search([**latitude, longitude**])\n**filter.map.radius** - radius around of point to search(**meters**)\n**sort** - Sort by "weight" or "proximity" *(if use proximity, require to use **map** filter)*\n',
          required: false,
          schema: {
            $ref: '#/definitions/params_15',
          },
        },
      ],
      responses: {
        200: {
          description: 'succesfull operation',
          schema: {
            $ref: '#/definitions/inline_response_200_20',
          },
        },
        404: {
          description: 'not found',
          schema: {
            $ref: '#/definitions/inline_response_400',
          },
        },
      },
    },
  },
  '/api/objectType/{name}/expertise': {
    get: {
      tags: [
        'object_type',
      ],
      summary: 'Return Object Type experts',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'name',
          in: 'path',
          description: 'Name of Object Type',
          required: true,
          type: 'string',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'Count of experts to skip, (default 0)',
          required: false,
          type: 'integer',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Count of experts to return, (default 5)',
          required: false,
          type: 'integer',
        },
      ],
      responses: {
        200: {
          description: 'succesfull operation',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/inline_response_200_21',
            },
          },
        },
      },
    },
  },
  '/api/ObjectTypesSearch': {
    post: {
      tags: [
        'object_type',
      ],
      summary: 'Search by name on Object Types',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'app',
          in: 'header',
          description: 'Specify app to enable waivio-wobject moderation',
          required: false,
          type: 'string',
        },
        {
          in: 'body',
          name: 'params',
          description: '**search_string** - Name or part of name Object Type\n**limit** - Count of object_typs to return (*default* 30),\n**skip** - Count of skipping object_type(for infinite scroll), *required*\n',
          required: false,
          schema: {
            $ref: '#/definitions/params_16',
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/ObjectType',
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
  '/api/objectType/showMoreTags': {
    get: {
      tags: [
        'object_type',
      ],
      summary: 'Return tags by tagCategory',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'skip',
          in: 'query',
          description: 'Count of tags to skip',
          required: false,
          type: 'integer',
          default: 0,
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Count of tags to return',
          required: false,
          type: 'integer',
          default: 10,
        },
        {
          name: 'tagCategory',
          in: 'query',
          description: 'name of tagCategory',
          required: true,
          type: 'string',
        },
        {
          name: 'objectType',
          in: 'query',
          description: 'type of object',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'succesfull operation',
          schema: {
            type: 'object',
            properties: {
              tagCategory: {
                type: 'string',
              },
              tags: {
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
        422: {
          description: 'Unprocessible Entity',
          schema: {
            $ref: '#/definitions/inline_response_400',
          },
        },
      },
    },
  },
  '/api/objectTypes/tags-for-filter': {
    post: {
      tags: [
        'object_type',
      ],
      summary: 'Return tags for filter',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          in: 'body',
          name: 'params',
          description: '**objectType** - string, name  of objectType required\n **wobjectLinks** - array wojects author_permlink',
          required: true,
          schema: {
            example: {
              objectType: 'restaurant',
              wobjectLinks: [
                'wgv-dark-place',
                'vvr-floret',
                'iwh-sushi-mura',
                'kri-not-bad-advice',
              ],
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'succesfull operation',
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tagCategory: {
                  type: 'string',
                },
                tags: {
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
        422: {
          description: 'Unprocessible Entity',
          schema: {
            $ref: '#/definitions/inline_response_400',
          },
        },
      },
    },
  },
  '/api/objectType/{objectTypeName}/tag-categories': {
    get: {
      tags: [
        'object_type',
      ],
      summary: 'Return tag categories with top tags',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'app',
          in: 'header',
          description: 'Specify app to enable waivio-wobject moderation',
          required: false,
          type: 'string',
        },
        {
          name: 'objectTypeName',
          in: 'path',
          description: 'Name of Object Type',
          required: true,
          type: 'string',
        },
        {
          name: 'tagsLimit',
          in: 'query',
          description: 'How many tags to return per category (default 3)',
          required: false,
          type: 'integer',
          default: 3,
        },
        {
          name: 'searchString',
          in: 'query',
          description: 'Optional search phrase to filter categories',
          required: false,
          type: 'string',
        },
        {
          name: 'selectedTags',
          in: 'query',
          description: 'Array of already selected tags to filter objects',
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
          description: 'succesfull operation',
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tagCategory: {
                  type: 'string',
                },
                tags: {
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
        422: {
          description: 'Unprocessible Entity',
          schema: {
            $ref: '#/definitions/inline_response_400',
          },
        },
      },
    },
  },
  '/api/objectType/{objectTypeName}/tag-categories/{tagCategory}': {
    get: {
      tags: [
        'object_type',
      ],
      summary: 'Return tags for specific tag category',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'app',
          in: 'header',
          description: 'Specify app to enable waivio-wobject moderation',
          required: false,
          type: 'string',
        },
        {
          name: 'objectTypeName',
          in: 'path',
          description: 'Name of Object Type',
          required: true,
          type: 'string',
        },
        {
          name: 'tagCategory',
          in: 'path',
          description: 'Tag category to expand',
          required: true,
          type: 'string',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'Count of tags to skip',
          required: false,
          type: 'integer',
          default: 0,
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Count of tags to return',
          required: false,
          type: 'integer',
          default: 10,
        },
        {
          name: 'searchString',
          in: 'query',
          description: 'Optional search phrase to filter tags inside category',
          required: false,
          type: 'string',
        },
        {
          name: 'selectedTags',
          in: 'query',
          description: 'Array of already selected tags to filter objects',
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
          description: 'succesfull operation',
          schema: {
            type: 'object',
            properties: {
              tagCategory: {
                type: 'string',
              },
              tags: {
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
        422: {
          description: 'Unprocessible Entity',
          schema: {
            $ref: '#/definitions/inline_response_400',
          },
        },
      },
    },
  },
};
