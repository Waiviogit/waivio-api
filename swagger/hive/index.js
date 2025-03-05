module.exports = {
  '/api/hive/reward-fund': {
    get: {
      tags: [
        'hive',
      ],
      description: 'Return cached get_reward_fund',
      produces: [
        'application/json',
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '0',
              },
              name: {
                type: 'string',
                example: 'post',
              },
              reward_balance: {
                type: 'string',
                example: '817612.161 HIVE',
              },
              recent_claims: {
                type: 'string',
                example: '519265763673530443',
              },
              last_update: {
                type: 'string',
                example: '2021-08-05T11:33:00',
              },
              content_constant: {
                type: 'string',
                example: '2000000000000',
              },
              percent_curation_rewards: {
                type: 'string',
                example: '5000',
              },
              percent_content_rewards: {
                type: 'string',
                example: '10000',
              },
              author_reward_curve: {
                type: 'string',
                example: 'linear',
              },
              curation_reward_curve: {
                type: 'string',
                example: 'linear',
              },
            },
          },
        },
      },
    },
  },
  '/api/hive/current-median-history': {
    get: {
      tags: [
        'hive',
      ],
      description: 'Return cached get_current_median_history_price',
      produces: [
        'application/json',
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              base: {
                type: 'string',
                example: '0.401 HBD',
              },
              quote: {
                type: 'string',
                example: '1.000 HIVE',
              },
            },
          },
        },
      },
    },
  },
  '/api/hive/block-num': {
    get: {
      tags: [
        'hive',
      ],
      description: 'Return last block num of chosen parser',
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'key',
          in: 'query',
          description: 'parser key',
          required: true,
          type: 'string',
          enum: [
            'last_block_num',
            'last_vote_block_num',
            'campaign_last_block_num',
          ],
        },
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              blockNum: {
                type: 'number',
                example: 56181880,
              },
            },
          },
        },
      },
    },
  },
  '/api/hive/global-properties': {
    get: {
      tags: [
        'hive',
      ],
      description: 'Return get_dynamic_global_properties',
      produces: [
        'application/json',
      ],
      responses: {
        200: {
          description: 'successful operation',
          schema: {
            type: 'object',
          },
        },
      },
    },
  },
};
