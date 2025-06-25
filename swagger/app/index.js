module.exports = {
  '/api/app/{appName}': {
    get: {
      tags: [
        'app',
      ],
      summary: 'Get waivio "App"',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Origin',
          in: 'header',
          description: 'Domain of website',
          required: true,
          type: 'string',
        },
        {
          name: 'appName',
          in: 'path',
          description: 'Name of registered "App" on waivio',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        200: {
          description: 'successful operation, link to uploaded image',
          schema: {
            $ref: '#/definitions/inline_response_200_23',
          },
        },
      },
    },
  },
  '/api/app/{appName}/experts': {
    get: {
      tags: [
        'app',
      ],
      summary: 'Get experts by specified app',
      description: 'If specified app has own supported_objects => return users which has some weight in this wobjects',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Origin',
          in: 'header',
          description: 'Domain of website',
          required: true,
          type: 'string',
        },
        {
          name: 'appName',
          in: 'path',
          description: 'Name of registered "App" on waivio',
          required: true,
          type: 'string',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Count of users to return(default 10)',
          required: false,
          type: 'number',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'Count of users to skip, for infinite scroll(default 0)',
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
              $ref: '#/definitions/inline_response_200_13',
            },
          },
        },
      },
    },
  },
  '/api/app/{name}/hashtags': {
    get: {
      tags: [
        'app',
      ],
      summary: 'Get specified hashtags by app',
      description: 'If app has "supported_hashtags" => return array of this wobjects',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'Origin',
          in: 'header',
          description: 'Domain of website',
          required: true,
          type: 'string',
        },
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
          description: 'Name of registered "App" on waivio',
          required: true,
          type: 'string',
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Count of hashtags to return(default 30)',
          required: false,
          type: 'number',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'Count of hashtags to skip, for infinite scroll(default 0)',
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
              $ref: '#/definitions/inline_response_200_12',
            },
          },
        },
      },
    },
  },
  '/api/waiv/metrics': {
    get: {
      tags: [
        'app',
      ],
      summary: 'Get WAIV metrics',
      produces: [
        'application/json',
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              tokensInCirculation: {
                type: 'string',
              },
              tokensStaked: {
                type: 'string',
              },
              totalMarketCapitalizationUSD: {
                type: 'string',
              },
              annualInflation: {
                type: 'string',
              },
              totalShares: {
                type: 'string',
              },
              availableInMonthUSD: {
                type: 'string',
              },
              distributedInMonthUSD: {
                type: 'string',
              },
              inflationDistribution: {
                type: 'object',
                properties: {
                  rewardsPool: {
                    type: 'string',
                  },
                  developmentFund: {
                    type: 'string',
                  },
                  liquidityProviders: {
                    type: 'string',
                  },
                },
              },
              rewardsPool: {
                type: 'object',
                properties: {
                  authors: {
                    type: 'string',
                  },
                  curators: {
                    type: 'string',
                  },
                },
              },
              positions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'number',
                    },
                    account: {
                      type: 'string',
                    },
                    tokenPair: {
                      type: 'string',
                    },
                    shares: {
                      type: 'string',
                    },
                    timeFactor: {
                      type: 'number',
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
  '/api/waiv/swap-history': {
    get: {
      tags: [
        'app',
      ],
      summary: 'Get WAIV swap history',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'Count of users to return(default 10)',
          required: false,
          type: 'number',
        },
        {
          name: 'skip',
          in: 'query',
          description: 'Count of users to skip, for infinite scroll(default 0)',
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
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                    },
                    blockNumber: {
                      type: 'number',
                    },
                    transactionId: {
                      type: 'string',
                    },
                    account: {
                      type: 'string',
                    },
                    operation: {
                      type: 'string',
                    },
                    refHiveBlockNumber: {
                      type: 'number',
                    },
                    symbolOut: {
                      type: 'string',
                    },
                    symbolIn: {
                      type: 'string',
                    },
                    symbolOutQuantity: {
                      type: 'string',
                    },
                    symbolInQuantity: {
                      type: 'string',
                    },
                    timestamp: {
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
  '/api/assistant': {
    post: {
      tags: [
        'app',
      ],
      summary: 'prompt to assistant',
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
              question: {
                type: 'string',
              },
              id: {
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
  '/api/assistant/history/{id}': {
    get: {
      tags: [
        'app',
      ],
      summary: 'prompt to assistant',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'chat id',
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
                    id: {
                      type: 'string',
                    },
                    text: {
                      type: 'string',
                    },
                    role: {
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
  '/api/places-api/image': {
    post: {
      tags: [
        'app',
      ],
      summary: 'prompt to assistant',
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
              userName: {
                type: 'string',
              },
              placesUrl: {
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
  '/api/places-api/objects': {
    post: {
      tags: [
        'app',
      ],
      summary: 'prompt to assistant',
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
              userName: {
                type: 'string',
              },
              longitude: {
                type: 'number',
              },
              latitude: {
                type: 'number',
              },
              includedTypes: {
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
              result: {
                type: 'array',
                items: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/places-api/text': {
    post: {
      tags: [
        'app',
      ],
      summary: 'prompt to assistant',
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
              userName: {
                type: 'string',
              },
              longitude: {
                type: 'number',
              },
              latitude: {
                type: 'number',
              },
              includedType: {
                type: 'string',
              },
              textQuery: {
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
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/safe-links': {
    get: {
      tags: [
        'app',
      ],
      summary: 'Get safe links data',
      description: 'Get safe links data',
      produces: [
        'application/json',
      ],
      parameters: [],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'string',
              },
              prefixLength: {
                type: 'number',
              },
              count: {
                type: 'number',
              },
            },
          },
        },
      },
    },
  },
};
