module.exports = {
  '/api/image': {
    post: {
      tags: [
        'image',
      ],
      summary: 'Upload image and get link',
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
          in: 'body',
          name: 'params',
          description: '**file** - Image file in form data, or\n **imageUrl** - link to exists image',
          required: false,
          schema: {
            type: 'object',
            properties: {
              imageUrl: {
                type: 'string',
              },
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'successful operation, link to uploaded image',
          schema: {
            type: 'object',
            properties: {
              image: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
};
