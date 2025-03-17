module.exports = {
  '/api/generalSearch': {
    post: {
      tags: [
        'general-search',
      ],
      summary: 'Search by wobjects, users, object-types',
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
          description: '**string** - String to search\n**userLimit** - Count of users to return (*default* 20),\n**wobjectsLimit** - Count of wobjects to return (*default* 20),\n**objectsTypeLimit** - Count of object types to return (*default* 20),\n**sortByApp** - Change priority of returning wobjects by cruical to specified App\n **user** - User name for check his followings',
          required: false,
          schema: {
            $ref: '#/definitions/params_17',
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
            $ref: '#/definitions/inline_response_200_22',
          },
        },
      },
    },
  },
};
