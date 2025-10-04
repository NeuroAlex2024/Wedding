/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const tasks = new Collection({
    id: 'd6bd34mns7p9w5k',
    created: '2024-01-01 00:00:00.000Z',
    updated: '2024-01-01 00:00:00.000Z',
    name: 'tasks',
    type: 'base',
    system: false,
    schema: [
      {
        system: false,
        id: 'task_title',
        name: 'title',
        type: 'text',
        required: true,
        presentable: true,
        unique: false,
        options: {
          min: 1,
          max: 160,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'task_done',
        name: 'done',
        type: 'bool',
        required: false,
        presentable: false,
        unique: false,
        options: {}
      },
      {
        system: false,
        id: 'task_owner',
        name: 'owner',
        type: 'relation',
        required: true,
        presentable: false,
        unique: false,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          minSelect: 1,
          maxSelect: 1,
          displayFields: []
        }
      }
    ],
    indexes: [],
    listRule: '@request.auth.id = owner',
    viewRule: '@request.auth.id = owner',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id = owner',
    deleteRule: '@request.auth.id = owner',
    options: {}
  });

  const budget = new Collection({
    id: 'b9z6f5k2q1n8r4s',
    created: '2024-01-01 00:00:00.000Z',
    updated: '2024-01-01 00:00:00.000Z',
    name: 'budget_items',
    type: 'base',
    system: false,
    schema: [
      {
        system: false,
        id: 'budget_title',
        name: 'title',
        type: 'text',
        required: true,
        presentable: true,
        unique: false,
        options: {
          min: 1,
          max: 160,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'budget_amount',
        name: 'amount',
        type: 'number',
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: null,
          noDecimal: false
        }
      },
      {
        system: false,
        id: 'budget_paid',
        name: 'paid',
        type: 'bool',
        required: false,
        presentable: false,
        unique: false,
        options: {}
      },
      {
        system: false,
        id: 'budget_owner',
        name: 'owner',
        type: 'relation',
        required: true,
        presentable: false,
        unique: false,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          minSelect: 1,
          maxSelect: 1,
          displayFields: []
        }
      }
    ],
    indexes: [],
    listRule: '@request.auth.id = owner',
    viewRule: '@request.auth.id = owner',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id = owner',
    deleteRule: '@request.auth.id = owner',
    options: {}
  });

  const invites = new Collection({
    id: 'i3l7m9p2q4s6t8u',
    created: '2024-01-01 00:00:00.000Z',
    updated: '2024-01-01 00:00:00.000Z',
    name: 'invites',
    type: 'base',
    system: false,
    schema: [
      {
        system: false,
        id: 'invite_slug',
        name: 'slug',
        type: 'text',
        required: true,
        presentable: true,
        unique: true,
        options: {
          min: 1,
          max: 80,
          pattern: '^[a-z0-9-]+$'
        }
      },
      {
        system: false,
        id: 'invite_title',
        name: 'title',
        type: 'text',
        required: true,
        presentable: true,
        unique: false,
        options: {
          min: 1,
          max: 160,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'invite_date',
        name: 'date',
        type: 'date',
        required: false,
        presentable: true,
        unique: false,
        options: {
          max: '',
          min: ''
        }
      },
      {
        system: false,
        id: 'invite_location',
        name: 'location',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: 160,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'invite_hero',
        name: 'hero',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: 255,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'invite_description',
        name: 'description',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: 1000,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'invite_published',
        name: 'isPublished',
        type: 'bool',
        required: false,
        presentable: false,
        unique: false,
        options: {}
      },
      {
        system: false,
        id: 'invite_owner',
        name: 'owner',
        type: 'relation',
        required: true,
        presentable: false,
        unique: false,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          minSelect: 1,
          maxSelect: 1,
          displayFields: []
        }
      }
    ],
    indexes: [
      'CREATE UNIQUE INDEX `idx_invites_slug` ON `invites` (`slug`);'
    ],
    listRule: '@request.auth.id = owner',
    viewRule: '@request.auth.id = owner || isPublished = true',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id = owner',
    deleteRule: '@request.auth.id = owner',
    options: {}
  });

  const vendors = new Collection({
    id: 'v1e3n5d7o9r2s4q',
    created: '2024-01-01 00:00:00.000Z',
    updated: '2024-01-01 00:00:00.000Z',
    name: 'vendors',
    type: 'base',
    system: false,
    schema: [
      {
        system: false,
        id: 'vendor_name',
        name: 'name',
        type: 'text',
        required: true,
        presentable: true,
        unique: false,
        options: {
          min: 1,
          max: 160,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'vendor_category',
        name: 'category',
        type: 'text',
        required: true,
        presentable: true,
        unique: false,
        options: {
          min: 1,
          max: 120,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'vendor_city',
        name: 'city',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: 120,
          pattern: ''
        }
      },
      {
        system: false,
        id: 'vendor_price',
        name: 'priceFrom',
        type: 'number',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: null,
          noDecimal: false
        }
      },
      {
        system: false,
        id: 'vendor_avatar',
        name: 'avatar',
        type: 'text',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: 255,
          pattern: ''
        }
      }
    ],
    indexes: [],
    listRule: '',
    viewRule: '',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {}
  });

  app.save(tasks);
  app.save(budget);
  app.save(invites);
  app.save(vendors);
}, (app) => {
  const collections = [
    'd6bd34mns7p9w5k',
    'b9z6f5k2q1n8r4s',
    'i3l7m9p2q4s6t8u',
    'v1e3n5d7o9r2s4q'
  ];

  collections.forEach((id) => {
    const collection = app.findCollectionByNameOrId(id);
    if (collection) {
      app.delete(collection);
    }
  });
});
