const { AUTH_HEADERS } = require('../headers');

module.exports = {
  '/api/hive-engine/deposit-withdraw': {
    post: {
      tags: [
        'hiveEngine',
      ],
      description: 'Create record deposit/withdraw',
      produces: [
        'application/json',
      ],
      parameters: [
        ...AUTH_HEADERS,
        {
          name: 'waivio-auth',
          in: 'header',
          description: 'send if it is guest',
          type: 'boolean',
        },
        {
          name: 'params',
          in: 'body',
          description: 'available types withdraw and deposit\n body is params and response from convert request\n if type withdraw - add key withdrawalAmount\n can be either address or account key',
          required: true,
          schema: {
            type: 'object',
            properties: {
              userName: {
                type: 'string',
              },
              type: {
                type: 'string',
                enum: [
                  'deposit',
                  'withdraw',
                ],
              },
              from_coin: {
                type: 'string',
              },
              to_coin: {
                type: 'string',
              },
              destination: {
                type: 'string',
              },
              pair: {
                type: 'string',
              },
              address: {
                type: 'string',
              },
              account: {
                type: 'string',
              },
              memo: {
                type: 'string',
              },
              ex_rate: {
                type: 'number',
              },
              withdrawalAmount: {
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
