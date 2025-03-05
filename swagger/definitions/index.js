module.exports = {
  hashtagCount: {
    type: 'object',
    properties: {
      hashtag: {
        type: 'string',
      },
      count: {
        type: 'number',
      },
    },
  },
  thread: {
    type: 'object',
    properties: {
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      parent_author: {
        type: 'string',
      },
      parent_permlink: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      replies: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      children: {
        type: 'number',
      },
      depth: {
        type: 'number',
      },
      stats: {
        type: 'object',
        properties: {
          total_votes: {
            type: 'number',
          },
        },
      },
      author_reputation: {
        type: 'number',
      },
      deleted: {
        type: 'boolean',
      },
      tickers: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      mentions: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      hashtags: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      links: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      images: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      threadstorm: {
        type: 'boolean',
      },
      net_rshares: {
        type: 'number',
      },
    },
  },
  postDraft: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      draftId: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      beneficiary: {
        type: 'boolean',
      },
      isUpdating: {
        type: 'boolean',
      },
      upvote: {
        type: 'boolean',
      },
      body: {
        type: 'string',
      },
      originalBody: {
        type: 'string',
      },
      jsonMetadata: {
        type: 'object',
      },
      lastUpdated: {
        type: 'number',
      },
      parentAuthor: {
        type: 'string',
      },
      parentPermlink: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      reward: {
        type: 'string',
      },
    },
  },
  objectDraft: {
    type: 'object',
    properties: {
      user: {
        type: 'string',
      },
      authorPermlink: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
    },
  },
  commentDraft: {
    type: 'object',
    properties: {
      user: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
    },
  },
  delegation_response_200: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        received: {
          type: 'array',
          items: {
            $ref: '#/definitions/delegationData',
          },
        },
        delegated: {
          type: 'array',
          items: {
            $ref: '#/definitions/delegationData',
          },
        },
        expirations: {
          type: 'array',
          items: {
            $ref: '#/definitions/expirationsData',
          },
        },
      },
    },
  },
  delegationData: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
      },
      delegator: {
        type: 'string',
      },
      delegatee: {
        type: 'string',
      },
      vesting_shares: {
        type: 'number',
      },
      delegation_date: {
        type: 'string',
      },
    },
  },
  expirationsData: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
      },
      delegator: {
        type: 'string',
      },
      vesting_shares: {
        type: 'number',
      },
      expiration: {
        type: 'string',
      },
    },
  },
  vipTicket: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      valid: {
        type: 'boolean',
      },
      userName: {
        type: 'string',
      },
      ticket: {
        type: 'string',
      },
      createdAt: {
        type: 'string',
      },
      updatedAt: {
        type: 'string',
      },
    },
  },
  mapCoordinates: {
    type: 'array',
    example: [
      {
        topPoint: [
          -91.479002,
          68.117143,
        ],
        bottomPoint: [
          -131.139244,
          49.152501,
        ],
      },
    ],
  },
  getMapCoordinates: {
    type: 'object',
    properties: {
      coordinates: {
        type: 'array',
        example: [
          {
            topPoint: [
              -91.479002,
              68.117143,
            ],
            bottomPoint: [
              -131.139244,
              49.152501,
            ],
          },
        ],
      },
      center: {
        type: 'array',
        example: [
          31.479002,
          68.117143,
        ],
      },
      zoom: {
        type: 'number',
      },
    },
  },
  firstLoad: {
    type: 'object',
    example: {
      configuration: {
        configurationFields: [
          'aboutObject',
          'colors',
          'desktopLogo',
          'desktopMap',
          'mobileLogo',
          'mobileMap',
        ],
        desktopLogo: 'https://images.hive.blog/800x600/https://images.hive.blog/p/HNWT6DgoBc196q36ADoGty1WEUBMYTezBR2yx2cmqPwhtM3UzUiz5qh45JxQmtbGZS9PVgVvxPEdKkRDNxzZmkcgxxdnLXMFfLgav4f8ftPqqgVfrVZ3x1kLRtE',
        mobileLogo: 'https://images.hive.blog/800x600/https://images.hive.blog/p/HNWT6DgoBc196q36ADoGty1WEUBMYTezBR2yx2cmqPwhtM3UzUiz5qh45JxQmtbGZS9PVgVvxPEdKkRDNxzZmkcgxxdnLXMFfLgav4f8ftPqqgVfrVZ3x1kLRtE',
        aboutObject: 'hive',
        currency: 'USD',
        desktopMap: {
          topPoint: [
            34.435,
            65.543,
          ],
          bottomPoint: [
            32.435,
            55.543,
          ],
        },
        mobileMap: {
          topPoint: [
            34.435,
            65.543,
          ],
          bottomPoint: [
            32.435,
            55.543,
          ],
        },
        colors: {
          background: '4533',
          font: '3543',
          hover: '3356',
          header: '433',
          button: '634',
          border: '5343',
          focus: '3353',
          links: '4654',
        },
      },
      host: 'van.dining.pp.ua',
      googleAnalyticsTag: null,
      googleGSCTag: null,
      beneficiary: {
        account: 'waivio',
        percent: 300,
      },
      supported_object_types: [
        'dish',
        'restaurant',
        'drink',
      ],
      status: 'active',
      mainPage: 'dining',
    },
  },
  getMap: {
    type: 'object',
    example: {
      userName: 'olegvladim',
      topPoint: [
        34.435,
        65.543,
      ],
      bottomPoint: [
        32.435,
        55.543,
      ],
      limit: 30,
      skip: 0,
    },
  },
  siteConfigurations: {
    type: 'object',
    example: {
      userName: 'olegvladim',
      host: 'van.dining.pp.ua',
      configuration: {
        desktopLogo: 'https://images.hive.blog/800x600/https://images.hive.blog/p/HNWT6DgoBc196q36ADoGty1WEUBMYTezBR2yx2cmqPwhtM3UzUiz5qh45JxQmtbGZS9PVgVvxPEdKkRDNxzZmkcgxxdnLXMFfLgav4f8ftPqqgVfrVZ3x1kLRtE',
        mobileLogo: 'https://images.hive.blog/800x600/https://images.hive.blog/p/HNWT6DgoBc196q36ADoGty1WEUBMYTezBR2yx2cmqPwhtM3UzUiz5qh45JxQmtbGZS9PVgVvxPEdKkRDNxzZmkcgxxdnLXMFfLgav4f8ftPqqgVfrVZ3x1kLRtE',
        aboutObject: 'afd-dfeedcxcb',
        desktopMap: {
          topPoint: [
            34.435,
            65.543,
          ],
          bottomPoint: [
            32.435,
            55.543,
          ],
        },
        mobileMap: {
          topPoint: [
            34.435,
            65.543,
          ],
          bottomPoint: [
            32.435,
            55.543,
          ],
        },
        colors: {
          background: '4533',
          font: '3543',
          hover: '3356',
          header: '433',
          button: '634',
          border: '5343',
          focus: '3353',
          links: '4654',
        },
      },
    },
  },
  getObjectFilters: {
    type: 'object',
    example: {
      restaurant: {
        Cuisine: [
          'asian',
        ],
        Features: [],
        'Good For': [
          'family',
        ],
      },
      dish: {
        Category: [],
        Ingredients: [],
      },
      drink: {
        Category: [],
        Ingredients: [],
      },
    },
  },
  refund: {
    type: 'array',
    example: [
      {
        _id: '5f7ad9c923de933796693d0b',
        status: 'pending',
        description: '',
        rejectMessage: '',
        userName: 'olegvladim',
        type: 'website_refund',
        blockNum: 1234,
        createdAt: '2020-10-05T08:31:05.174Z',
        updatedAt: '2020-10-05T08:31:05.174Z',
        __v: 0,
        amount: 99,
      },
    ],
  },
  authorities: {
    type: 'array',
    example: [
      {
        _id: '5cc3215ad0555b20e1d4d2a3',
        name: 'asd09',
        json_metadata: '{"profile":{"about":"This is a Waivio bot service. It is being used to maintain Object Reference Protocol on Steem blockchain","cover_image":"https://cdn.steemitimages.com/DQmaj3MLuivowwzq9Ks7H6oJJRWMZqMk7ScpmwjovdvdKW5/Positive%20Vibes%20(3).png","location":"Internet","name":"Waivio Service ","profile_image":"https://steemitimages.com/p/4HFqJv9qRjVeVQzX3gvDHytNF793bg88B7fESPieLQ8dxJ6Kt6ZDcMkQZftXp7DiLCjkepEzG4foz3EF6Us1xm5x7MMNraHbpCe8rKsNc1Gou2vSYDYYBMVCijP5JAg2jo25n6eziBrbXsNa3qeoJFBexGLxsyLTCCW","website":"http://waiviodev.com/","twitter":"","youtube":"asd08"}}',
        alias: 'Waivio Service ',
        posting_json_metadata: '{"profile":{"about":"This is a Waivio bot service. It is being used to maintain Object Reference Protocol on Steem blockchain","cover_image":"https://cdn.steemitimages.com/DQmaj3MLuivowwzq9Ks7H6oJJRWMZqMk7ScpmwjovdvdKW5/Positive%20Vibes%20(3).png","location":"Internet","name":"Waivio Service ","profile_image":"https://steemitimages.com/p/4HFqJv9qRjVeVQzX3gvDHytNF793bg88B7fESPieLQ8dxJ6Kt6ZDcMkQZftXp7DiLCjkepEzG4foz3EF6Us1xm5x7MMNraHbpCe8rKsNc1Gou2vSYDYYBMVCijP5JAg2jo25n6eziBrbXsNa3qeoJFBexGLxsyLTCCW","website":"http://waiviodev.com/","twitter":"","youtube":"asd08"}}',
      },
    ],
  },
  reportPage: {
    type: 'object',
    example: {
      payments: [
        {
          userName: 'olegvladim',
          balance: 99,
          host: 'van.dining.pp.ua',
          createdAt: '2020-10-01T12:42:35.519Z',
          amount: 1,
          type: 'writeOff',
          countUsers: 2,
          currencyRate: 1,
        },
        {
          userName: 'olegvladim',
          balance: 100,
          createdAt: '2020-10-01T09:42:35.519Z',
          amount: 100,
          type: 'transfer',
          currencyRate: 1,
        },
      ],
      ownerAppNames: [
        'van.dining.pp.ua',
      ],
      dataForPayments: {
        user: {
          _id: '5caf42256fb6c810cde66d20',
          name: 'waivio.hosting',
          alias: '',
          json_metadata: '',
          posting_json_metadata: '',
        },
        memo: '{"id":"websitesPayment"}',
      },
    },
  },
  managePage: {
    type: 'object',
    example: {
      websites: [
        {
          status: 'pending',
          name: 'van',
          host: 'van.dining.pp.ua',
          parent: 'dining.pp.ua',
          averageDau: 2,
        },
      ],
      prices: {
        minimumValue: 1,
        perUser: 0.005,
        perSuspended: 0.2,
      },
      accountBalance: {
        paid: 99,
        avgDau: 2,
        dailyCost: 0,
        remainingDays: null,
      },
      dataForPayments: {
        user: {
          _id: '5caf42256fb6c810cde66d20',
          name: 'waivio.hosting',
          alias: '',
          json_metadata: '',
          posting_json_metadata: '',
        },
        memo: '{"id":"websitesPayment"}',
      },
    },
  },
  wobjectonlist: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      author_permlink: {
        type: 'string',
      },
      weight: {
        type: 'number',
      },
      user_count: {
        type: 'integer',
      },
      app: {
        type: 'string',
      },
      parents: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      children: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      users: {
        type: 'array',
        items: {
          $ref: '#/definitions/wobjectonlist_users',
        },
      },
      fields: {
        type: 'array',
        items: {
          $ref: '#/definitions/apiuseruserNamefollowing_objects_fields',
        },
      },
    },
  },
  wobject: {
    type: 'object',
    required: ['author_permlink', 'default_name', 'creator', 'author'],
    properties: {
      app: {
        type: 'string',
      },
      community: {
        type: 'string',
      },
      default_name: {
        type: 'string',
      },
      is_posting_open: {
        type: 'boolean',
      },
      is_extending_open: {
        type: 'boolean',
      },
      creator: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      author_permlink: {
        type: 'string',
      },
      weight: {
        type: 'number',
      },
      parent: {
        type: 'object',
      },
      children: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      authority: {
        type: 'object',
      },
      status: {
        type: 'object',
      },
      propositions: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      updatesCount: {
        type: 'number',
        example: 21,
      },
      name: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      avatar: {
        type: 'string',
      },
      background: {
        type: 'string',
      },
      defaultShowLink: {
        type: 'string',
      },
      rating: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      ratings: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      tagCategory: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      galleryAlbum: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      galleryItem: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      delegation: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      walletAddress: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      similar: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      addOn: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      related: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      pin: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      remove: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      features: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      groupId: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      productId: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      companyId: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      departments: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      authors: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      options: {
        type: 'object',
      },
    },
  },
  wobjField: {
    type: 'object',
    properties: {
      weight: {
        type: 'number',
      },
      locale: {
        type: 'string',
      },
      _id: {
        type: 'string',
      },
      creator: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      children: {
        type: 'number',
      },
      approvePercent: {
        type: 'number',
      },
      active_votes: {
        type: 'array',
        items: {
          $ref: '#/definitions/post_active_votes',
        },
      },
      items: {
        type: 'array',
        items: {
          $ref: '#/definitions/raw_field',
        },
      },
    },
  },
  raw_field: {
    type: 'object',
    properties: {
      weight: {
        type: 'number',
      },
      body: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      locale: {
        type: 'string',
      },
      creator: {
        type: 'string',
      },
      active_votes: {
        type: 'array',
        items: {
          $ref: '#/definitions/post_active_votes',
        },
      },
    },
  },
  guest_wallet: {
    type: 'object',
    properties: {
      refHiveBlockNumber: {
        type: 'number',
      },
      blockNumber: {
        type: 'number',
      },
      account: {
        type: 'string',
      },
      transactionId: {
        type: 'string',
      },
      operation: {
        type: 'string',
      },
      timestamp: {
        type: 'number',
      },
      quantity: {
        type: 'string',
      },
      symbol: {
        type: 'string',
      },
      authorperm: {
        type: 'string',
      },
      from: {
        type: 'string',
      },
      to: {
        type: 'string',
      },
    },
  },
  User: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      profile_image: {
        type: 'string',
      },
      objects_following_count: {
        type: 'integer',
      },
      objects_shares_count: {
        type: 'integer',
      },
      objects_follow: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      wobjects_weight: {
        type: 'integer',
      },
      youFollows: {
        type: 'boolean',
      },
      followsYou: {
        type: 'boolean',
      },
      muted: {
        type: 'boolean',
      },
      last_activity: {
        type: 'string',
      },
    },
  },
  ObjectType: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
    },
  },
  post: {
    type: 'object',
    properties: {
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      category: {
        type: 'string',
      },
      parent_author: {
        type: 'string',
      },
      parent_permlink: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      json_metadata: {
        type: 'string',
      },
      last_update: {
        type: 'string',
      },
      last_payout: {
        type: 'string',
      },
      created: {
        type: 'string',
      },
      active: {
        type: 'string',
      },
      depth: {
        type: 'integer',
      },
      children: {
        type: 'integer',
      },
      net_rshares: {
        type: 'integer',
      },
      abs_rshares: {
        type: 'integer',
      },
      vote_rshares: {
        type: 'integer',
      },
      children_abs_rshares: {
        type: 'integer',
      },
      cashout_time: {
        type: 'string',
      },
      max_cashout_time: {
        type: 'string',
      },
      total_vote_weight: {
        type: 'integer',
      },
      reward_weight: {
        type: 'integer',
      },
      total_payout_value: {
        type: 'integer',
      },
      curator_payout_value: {
        type: 'integer',
      },
      author_rewards: {
        type: 'integer',
      },
      net_votes: {
        type: 'integer',
      },
      root_author: {
        type: 'string',
      },
      root_permlink: {
        type: 'string',
      },
      max_accepted_payout: {
        type: 'string',
      },
      percent_steem_dollars: {
        type: 'integer',
      },
      allow_replies: {
        type: 'boolean',
      },
      allow_votes: {
        type: 'boolean',
      },
      allow_curation_rewards: {
        type: 'boolean',
      },
      beneficiaries: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      url: {
        type: 'string',
      },
      root_title: {
        type: 'string',
      },
      pending_payout_value: {
        type: 'string',
      },
      active_votes: {
        type: 'array',
        items: {
          $ref: '#/definitions/post_active_votes',
        },
      },
      replies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      author_reputation: {
        type: 'integer',
      },
      promoted: {
        type: 'string',
      },
      body_length: {
        type: 'integer',
      },
      reblogged_by: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      wobjects: {
        type: 'array',
        items: {
          $ref: '#/definitions/wobject',
        },
      },
      youFollows: {
        type: 'boolean',
      },
    },
  },
  postTags: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      counter: {
        type: 'number',
      },
      author_permlink: {
        type: 'string',
      },
    },
  },
  userMetadata: {
    type: 'object',
    properties: {
      user_metadata: {
        $ref: '#/definitions/userMetadata_user_metadata',
      },
    },
    xml: {
      name: 'User',
    },
  },
  inline_response_200: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      wobjects_weight: {
        type: 'number',
      },
      json_metadata: {
        type: 'string',
      },
      youFollows: {
        type: 'boolean',
      },
      followsYou: {
        type: 'boolean',
      },
    },
  },
  params: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      skip: {
        type: 'integer',
      },
      limit: {
        type: 'integer',
      },
      name: {
        type: 'string',
      },
    },
  },
  inline_response_200_1: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200',
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_2: {
    type: 'object',
    properties: {
      result: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_3: {
    type: 'object',
    properties: {
      name: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_4: {
    type: 'object',
    properties: {
      account: {
        type: 'string',
      },
      wobjects_weight: {
        type: 'number',
      },
      followers_count: {
        type: 'number',
      },
      followsYou: {
        type: 'boolean',
      },
      youFollows: {
        type: 'boolean',
      },
    },
  },
  params_1: {
    type: 'object',
    properties: {
      locale: {
        type: 'string',
      },
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
    },
  },
  apiuseruserNamefollowing_objects_fields: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      weight: {
        type: 'number',
      },
      locale: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
    },
  },
  inline_response_200_5: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      author_permlink: {
        type: 'string',
      },
      weight: {
        type: 'number',
      },
      app: {
        type: 'string',
      },
      parents: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      children: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      fields: {
        type: 'array',
        items: {
          $ref: '#/definitions/apiuseruserNamefollowing_objects_fields',
        },
      },
    },
  },
  inline_response_200_6: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            wobjects_weight: {
              type: 'number',
            },
            followers_count: {
              type: 'number',
            },
            youFollows: {
              type: 'boolean',
            },
            followsYou: {
              type: 'boolean',
            },
          },
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  params_2: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
    },
  },
  params_3: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      count_with_wobj: {
        type: 'integer',
      },
      last_permlink: {
        type: 'string',
      },
      last_author: {
        type: 'string',
      },
      user_languages: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  params_4: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      locale: {
        type: 'string',
      },
      object_types: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      exclude_object_types: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  inline_response_200_7_wobjects: {
    type: 'object',
    properties: {
      author_permlink: {
        type: 'string',
      },
      user_weight: {
        type: 'integer',
      },
      weight: {
        type: 'integer',
      },
      is_posting_open: {
        type: 'boolean',
      },
      is_extending_open: {
        type: 'boolean',
      },
      object_type: {
        type: 'string',
      },
      default_name: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      creator: {
        type: 'string',
      },
      app: {
        type: 'string',
      },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
    },
  },
  inline_response_200_7: {
    type: 'object',
    properties: {
      wobjects: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200_7_wobjects',
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  params_5: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      tagsArray: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  inline_response_200_8: {
    type: 'object',
    properties: {
      followers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            wobjects_weight: {
              type: 'number',
            },
            youFollows: {
              type: 'boolean',
            },
            followsYou: {
              type: 'boolean',
            },
          },
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_9_users_updates_users: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      wobjects_weight: {
        type: 'number',
      },
      last_posts_count: {
        type: 'number',
      },
    },
  },
  inline_response_200_9_users_updates: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200_9_users_updates_users',
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_9_related_wobjects: {
    type: 'object',
    properties: {
      author_permlink: {
        type: 'string',
      },
      user_weight: {
        type: 'number',
      },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      last_posts_count: {
        type: 'number',
      },
    },
  },
  inline_response_200_9_wobjects_updates: {
    type: 'object',
    properties: {
      object_type: {
        type: 'string',
      },
      related_wobjects: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200_9_related_wobjects',
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_9: {
    type: 'object',
    properties: {
      users_updates: {
        $ref: '#/definitions/inline_response_200_9_users_updates',
      },
      wobjects_updates: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200_9_wobjects_updates',
        },
      },
    },
  },
  inline_response_200_10: {
    type: 'object',
    properties: {
      related_wobjects: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200_9_related_wobjects',
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_11: {
    type: 'object',
    properties: {
      ok: {
        type: 'string',
      },
    },
  },
  inline_response_400: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
      },
    },
  },
  apiwobject_map: {
    type: 'object',
    properties: {
      coordinates: {
        type: 'array',
        items: {
          type: 'number',
        },
      },
      radius: {
        type: 'number',
      },
    },
  },
  params_6: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      user_limit: {
        type: 'integer',
      },
      locale: {
        type: 'string',
      },
      author_permlinks: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      object_types: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      exclude_object_types: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      required_fields: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      sample: {
        type: 'boolean',
      },
      map: {
        $ref: '#/definitions/apiwobject_map',
      },
    },
  },
  inline_response_200_12: {
    type: 'object',
    properties: {
      hasMore: {
        type: 'boolean',
      },
      wobjects: {
        type: 'array',
        items: {
          $ref: '#/definitions/wobjectonlist',
        },
      },
    },
  },
  params_7: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      user_languages: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  params_8: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      sort: {
        type: 'string',
      },
    },
  },
  inline_response_200_13: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      weight: {
        type: 'number',
      },
    },
  },
  params_9: {
    type: 'object',
    properties: {
      fields_names: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      custom_fields: {
        type: 'object',
        properties: {},
      },
    },
    example: {
      fields_names: [
        'categoryItem',
      ],
      custom_fields: {
        categoryId: 123456,
      },
    },
  },
  inline_response_200_14: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      weight: {
        type: 'integer',
      },
      locale: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
    },
  },
  inline_response_200_15: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      weight: {
        type: 'integer',
      },
      locale: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
    },
  },
  params_10: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      user: {
        type: 'string',
      },
      newsFilter: {
        type: 'string',
      },
    },
  },
  inline_response_200_16_users: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      weight: {
        type: 'integer',
      },
    },
  },
  inline_response_200_16_users2: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      weight: {
        type: 'integer',
      },
      youFollows: {
        type: 'boolean',
      },
      followsYou: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_get_wobj_fields: {
    type: 'object',
    properties: {
      weight: {
        type: 'number',
      },
      locale: {
        type: 'string',
      },
      _id: {
        type: 'string',
      },
      creator: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      body: {
        type: 'number',
      },
      active_votes: {
        type: 'array',
      },
      children: {
        type: 'number',
      },
      total_payout_value: {
        type: 'string',
      },
      pending_payout_value: {
        type: 'string',
      },
      curator_payout_value: {
        type: 'string',
      },
      cashout_time: {
        type: 'string',
      },
      fullBody: {
        type: 'string',
      },
      approvePercent: {
        type: 'number',
      },
      createdAt: {
        type: 'number',
      },
    },
  },
  inline_response_200_16_users3: {
    type: 'object',
    properties: {
      wobjectFollowers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            wobjects_weight: {
              type: 'number',
            },
            followers_count: {
              type: 'number',
            },
            youFollows: {
              type: 'boolean',
            },
            followsYou: {
              type: 'boolean',
            },
          },
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  inline_response_200_16: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200_16_users2',
        },
      },
      user: {
        $ref: '#/definitions/inline_response_200_16_users',
      },
    },
  },
  params_11: {
    type: 'object',
    required: [
      'search_string',
    ],
    properties: {
      search_string: {
        type: 'string',
      },
      sort: {
        type: 'string',
        enum: [
          'weight',
          'createdAt',
        ],
        default: 'weight',
      },
      object_type: {
        type: 'string',
      },
      userName: {
        type: 'string',
      },
      simplified: {
        type: 'boolean',
      },
      map: {
        type: 'object',
        properties: {
          coordinates: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
          radius: {
            type: 'number',
          },
        },
      },
      tagCategory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            categoryName: {
              type: 'string',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      locale: {
        type: 'string',
      },
      sortByApp: {
        type: 'string',
      },
      required_fields: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      box: {
        $ref: '#/definitions/box_params',
      },
      addHashtag: {
        type: 'boolean',
      },
      mapMarkers: {
        type: 'boolean',
      },
      onlyObjectTypes: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  params_wobject_map_last_post: {
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
      objectType: {
        type: 'string',
      },
    },
  },
  res_wobject_map_last_post: {
    type: 'object',
    properties: {
      hasMore: {
        type: 'boolean',
      },
      wobjects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            author_permlink: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            address: {
              type: 'string',
            },
            defaultShowLink: {
              type: 'string',
            },
            default_name: {
              type: 'string',
            },
            object_type: {
              type: 'string',
            },
            post: {
              $ref: '#/definitions/post',
            },
          },
        },
      },
    },
  },
  res_wobject_campaign_required: {
    type: 'object',
    properties: {
      hasMore: {
        type: 'boolean',
      },
      wobjects: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
    },
  },
  params_wobject_map_experts: {
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
  params_wobject_campaign_required: {
    type: 'object',
    properties: {
      skip: {
        type: 'number',
      },
      limit: {
        type: 'number',
      },
      requiredObject: {
        type: 'string',
      },
    },
  },
  res_wobject_map_experts: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            followers_count: {
              type: 'number',
            },
            weight: {
              type: 'number',
            },
            followsYou: {
              type: 'boolean',
            },
            youFollows: {
              type: 'boolean',
            },
          },
        },
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  box_params: {
    type: 'object',
    properties: {
      topPoint: {
        type: 'array',
        example: [
          -91.479002,
          68.117143,
        ],
      },
      bottomPoint: {
        type: 'array',
        example: [
          -131.139244,
          49.152501,
        ],
      },
    },
  },
  inline_response_200_17: {
    type: 'object',
    properties: {
      author_permlink: {
        type: 'string',
      },
      weight: {
        type: 'integer',
      },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
    },
  },
  params_12: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
      },
      skip: {
        type: 'number',
      },
    },
  },
  inline_response_200_18: {
    type: 'object',
    properties: {
      feed_price: {
        type: 'object',
        properties: {},
      },
      props: {
        type: 'object',
        properties: {},
      },
      tags: {
        type: 'object',
        properties: {},
      },
      accounts: {
        type: 'object',
        properties: {},
      },
      content: {
        type: 'object',
        properties: {},
      },
      tag_idx: {
        type: 'object',
        properties: {},
      },
      discussion_idx: {
        type: 'object',
        properties: {},
      },
    },
  },
  params_13: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      category: {
        type: 'string',
      },
    },
  },
  params_14: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
      wobjects_count: {
        type: 'integer',
      },
    },
  },
  params_15: {
    type: 'object',
    properties: {
      userName: {
        type: 'string',
      },
      wobjects_count: {
        type: 'integer',
      },
      wobjects_skip: {
        type: 'integer',
      },
      filter: {
        $ref: '#/definitions/apiobjectTypename_filter',
      },
      sort: {
        type: 'string',
      },
      simplified: {
        type: 'boolean',
      },
    },
  },
  params_16: {
    type: 'object',
    properties: {
      search_string: {
        type: 'string',
      },
      limit: {
        type: 'integer',
      },
      skip: {
        type: 'integer',
      },
    },
  },
  params_17: {
    type: 'object',
    properties: {
      string: {
        type: 'string',
      },
      userLimit: {
        type: 'integer',
      },
      wobjectsLimit: {
        type: 'integer',
      },
      objectTypesLimit: {
        type: 'integer',
      },
      sortByApp: {
        type: 'string',
      },
      onlyObjectTypes: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  params_18: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        followers_count: {
          type: 'number',
        },
        wobjects_weight: {
          type: 'number',
        },
        blockedBy: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  },
  params_20: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        author: {
          type: 'string',
        },
        permlink: {
          type: 'string',
        },
      },
    },
  },
  inline_response_200_19: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      related_wobjects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
    },
  },
  apiobjectTypename_filter: {
    type: 'object',
    properties: {
      map: {
        $ref: '#/definitions/apiwobject_map',
      },
    },
  },
  inline_response_200_20_filters: {
    type: 'object',
    properties: {
      map: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  inline_response_200_20: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      related_wobjects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      hasMoreWobjects: {
        type: 'boolean',
      },
      filters: {
        $ref: '#/definitions/inline_response_200_20_filters',
      },
    },
  },
  inline_response_200_21: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      weight: {
        type: 'number',
      },
    },
  },
  inline_response_200_22: {
    type: 'object',
    properties: {
      wobjects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      objectTypes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      accounts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
    },
  },
  inline_response_200_23_moderators: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      author_permlinks: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  inline_response_200_23_supported_object_types: {
    type: 'object',
    properties: {
      object_type: {
        type: 'string',
      },
      required_fields: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  inline_response_200_23_daily_chosen_post: {
    type: 'object',
    properties: {
      author: {
        type: 'string',
      },
      permlink: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
    },
  },
  inline_response_200_23: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      admins: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      moderators: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200_23_moderators',
        },
      },
      supported_object_types: {
        type: 'array',
        items: {
          $ref: '#/definitions/inline_response_200_23_supported_object_types',
        },
      },
      supported_objects: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      daily_chosen_post: {
        $ref: '#/definitions/inline_response_200_23_daily_chosen_post',
      },
      weekly_chosen_post: {
        $ref: '#/definitions/inline_response_200_23_daily_chosen_post',
      },
    },
  },
  wobjectonlist_users: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      profile_image: {
        type: 'string',
      },
      weight: {
        type: 'number',
      },
    },
  },
  post_active_votes: {
    type: 'object',
    properties: {
      voter: {
        type: 'string',
      },
      weight: {
        type: 'integer',
      },
      perent: {
        type: 'integer',
      },
    },
  },
  userMetadata_user_metadata_settings: {
    type: 'object',
    properties: {
      exitPageSetting: {
        type: 'boolean',
      },
      locale: {
        type: 'string',
      },
      postLocales: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      nightmode: {
        type: 'boolean',
      },
      rewardSetting: {
        type: 'string',
      },
      rewriteLinks: {
        type: 'boolean',
      },
      showNSFWPosts: {
        type: 'boolean',
      },
      upvoteSetting: {
        type: 'boolean',
      },
      votePercent: {
        type: 'number',
      },
      votingPower: {
        type: 'boolean',
      },
      currency: {
        type: 'string',
        example: 'USD',
        enum: [
          'USD',
          'CAD',
        ],
      },
    },
  },
  userMetadata_user_metadata: {
    type: 'object',
    properties: {
      notifications_last_timestamp: {
        type: 'number',
      },
      bookmarks: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      drafts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      canMute: {
        type: 'boolean',
      },
      settings: {
        $ref: '#/definitions/userMetadata_user_metadata_settings',
      },
    },
  },
  objectTypeParam: {
    type: 'object',
    properties: {
      objectType: {
        type: 'string',
        enum: [
          'restaurant',
          'dish',
          'drink',
        ],
      },
    },
  },
  wobjCountersByArea: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          example: 'Vancouver',
        },
        route: {
          type: 'string',
          example: 'center=49.25997734756513%2C-123.16840544074762&zoom=13',
        },
        counter: {
          type: 'number',
          example: 2135,
        },
      },
    },
  },
  prefetch_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Vancouver Restaurants',
      },
      tag: {
        type: 'string',
        example: 'italian',
      },
      type: {
        type: 'string',
        enum: [
          'restaurant',
          'dish',
          'drink',
        ],
      },
      category: {
        type: 'string',
        enum: [
          'Cuisine',
          'Features',
          'Good+For',
          'Ingredients',
          'Category',
        ],
      },
      image: {
        type: 'string',
        description: 'link to the uploaded image',
        example: 'https://images.unsplash.com/photo-1546549032-9571c=crop&w=334&q=80',
      },
    },
  },
  created_prefetch_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Vancouver Restaurants',
      },
      tag: {
        type: 'string',
        example: 'italian',
      },
      type: {
        type: 'string',
        enum: [
          'restaurant',
          'dish',
          'drink',
        ],
      },
      category: {
        type: 'string',
        enum: [
          'Cuisine',
          'Features',
          'Good+For',
          'Ingredients',
          'Category',
        ],
      },
      image: {
        type: 'string',
        description: 'link to the uploaded image',
        example: 'https://waivio.nyc3.digitaloceanspaces.com/photo-1546549032-9571c=crop&w=334&q=80',
      },
      route: {
        type: 'string',
        description: 'prepared route for searching on the map',
        example: 'type=restaurant&Cuisine=italian',
      },
    },
  },
  wobjects_nearby_metadata: {
    type: 'object',
    properties: {
      wobjects: {
        type: 'array',
        items: {
          $ref: '#/definitions/wobjectonlist',
        },
      },
    },
  },
  shop_filter: {
    type: 'object',
    properties: {
      rating: {
        type: 'number',
      },
      tagCategory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            categoryName: {
              type: 'string',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  shop_object_feed: {
    type: 'object',
    properties: {
      wobjects: {
        type: 'array',
        items: {
          $ref: '#/definitions/wobject',
        },
      },
      department: {
        type: 'string',
      },
      hasMore: {
        type: 'boolean',
      },
    },
  },
  tagCategory_response: {
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
  shop_filter_resp: {
    type: 'object',
    properties: {
      rating: {
        type: 'array',
        items: {
          type: 'number',
        },
      },
      tagCategory: {
        type: 'array',
        items: {
          $ref: '#/definitions/tagCategory_response',
        },
      },
    },
  },
  departments_response: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      subdirectory: {
        type: 'boolean',
      },
      related: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  ad_sense: {
    type: 'object',
    properties: {
      level: {
        type: 'string',
      },
      code: {
        type: 'string',
      },
    },
  },
  affiliate_list: {
    type: 'object',
    properties: {
      host: {
        type: 'string',
      },
      countryCode: {
        type: 'string',
      },
      type: {
        type: 'string',
      },
      affiliateCode: {
        type: 'string',
      },
    },
  },
  advancedReportParams: {
    type: 'object',
    properties: {
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
      filterAccounts: {
        type: 'array',
        items: {
          type: 'string',
          example: 'blaster',
        },
      },
      startDate: {
        type: 'number',
        example: 1619816400,
      },
      endDate: {
        type: 'number',
        example: 1621857636,
      },
      limit: {
        type: 'number',
      },
      user: {
        type: 'string',
        example: 'blauser',
      },
      currency: {
        type: 'string',
        example: 'UAH',
      },
      symbol: {
        type: 'string',
        example: 'WAIV',
      },
    },
  },
  engineReportWallet: {
    type: 'object',
    properties: {
      account: {
        type: 'string',
      },
      symbol: {
        type: 'string',
      },
      operation: {
        type: 'string',
      },
      transactionId: {
        type: 'string',
      },
      _id: {
        type: 'string',
      },
      timestamp: {
        type: 'number',
      },
      blockNumber: {
        type: 'number',
      },
      checked: {
        type: 'boolean',
      },
    },
  },
  withdrawHiveTransaction: {
    type: 'object',
    properties: {
      account: {
        type: 'string',
      },
      inputCoinType: {
        type: 'string',
      },
      outputCoinType: {
        type: 'string',
      },
      amount: {
        type: 'number',
        format: 'float',
      },
      outputAmount: {
        type: 'number',
        format: 'float',
      },
      status: {
        type: 'string',
      },
      address: {
        type: 'string',
      },
      memo: {
        type: 'string',
      },
      usdValue: {
        type: 'number',
        format: 'float',
      },
      commission: {
        type: 'number',
        format: 'float',
      },
      receiver: {
        type: 'string',
      },
      transactionId: {
        type: 'string',
      },
      transactionHash: {
        type: ['string', 'null'],
      },
      exchangeId: {
        type: 'string',
      },
    },
    required: [
      'account',
      'inputCoinType',
      'outputCoinType',
      'amount',
      'outputAmount',
      'status',
      'address',
      'usdValue',
      'receiver',
      'transactionId',
      'exchangeId',
    ],
  },
  engineReportStatus: {
    type: 'object',
    properties: {
      reportId: {
        type: 'string',
      },
      user: {
        type: 'string',
      },
      currency: {
        type: 'string',
      },
      startDate: {
        type: 'string',
      },
      endDate: {
        type: 'string',
      },
      filterAccounts: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      accounts: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      deposits: {
        type: 'string',
      },
      withdrawals: {
        type: 'string',
      },
      status: {
        type: 'string',
      },
    },
  },
};
