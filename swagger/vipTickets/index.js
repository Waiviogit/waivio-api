const { AUTH_HEADERS } = require('../headers');

module.exports = {
  '/api/vip-tickets': {
    get: {
      tags: [
        'vipTickets',
      ],
      description: 'Return list two lists: activeTickets & consumedTickets',
      produces: [
        'application/json',
      ],
      parameters: [
        ...AUTH_HEADERS,
        {
          name: 'userName',
          in: 'query',
          description: 'name of hive user',
          required: true,
          type: 'string',
        },
        {
          name: 'activeSkip',
          in: 'query',
          description: 'skip active tickets list',
          required: false,
          type: 'number',
        },
        {
          name: 'consumedSkip',
          in: 'query',
          description: 'skip consumed tickets list',
          required: false,
          type: 'number',
        },
        {
          name: 'activeLimit',
          in: 'query',
          description: 'limit active tickets list',
          required: false,
          type: 'number',
        },
        {
          name: 'consumedLimit',
          in: 'query',
          description: 'limit consumed tickets list',
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
              price: {
                type: 'number',
              },
              activeTickets: {
                type: 'array',
                items: {
                  $ref: '#/definitions/vipTicket',
                },
              },
              consumedTickets: {
                type: 'array',
                items: {
                  $ref: '#/definitions/vipTicket',
                },
              },
              hasMoreActive: {
                type: 'boolean',
              },
              hasMoreConsumed: {
                type: 'boolean',
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
    patch: {
      tags: [
        'vipTickets',
      ],
      description: 'edit vipTicket note',
      produces: [
        'application/json',
      ],
      parameters: [
        ...AUTH_HEADERS,
        {
          name: 'params',
          in: 'body',
          description: '**userName** - name of authorised user\n**ticket** - vip ticket\n**note** - note',
          required: true,
          schema: {
            example: {
              userName: 'grampo',
              ticket: '4534-dfds-54345-45325-5434',
              note: 'my note',
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'response',
          schema: {
            $ref: '#/definitions/vipTicket',
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
