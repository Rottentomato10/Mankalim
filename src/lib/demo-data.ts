// Demo data for testing without a database

export const DEMO_ASSET_CLASSES = [
  {
    id: 'demo-ac-1',
    userId: 'demo-user-123',
    name: 'נזיל',
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    instruments: [
      {
        id: 'demo-inst-1',
        assetClassId: 'demo-ac-1',
        name: 'חשבון בנק',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        providers: [
          {
            id: 'demo-prov-1',
            instrumentId: 'demo-inst-1',
            name: 'בנק הפועלים',
            displayOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            assets: [
              {
                id: 'demo-asset-1',
                providerId: 'demo-prov-1',
                name: 'עו"ש משפחתי',
                isLiquid: true,
                currency: 'ILS',
                notes: null,
                displayOrder: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: 'demo-asset-2',
                providerId: 'demo-prov-1',
                name: 'חיסכון דולרי',
                isLiquid: true,
                currency: 'USD',
                notes: null,
                displayOrder: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
          {
            id: 'demo-prov-2',
            instrumentId: 'demo-inst-1',
            name: 'בנק לאומי',
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            assets: [
              {
                id: 'demo-asset-3',
                providerId: 'demo-prov-2',
                name: 'עו"ש',
                isLiquid: true,
                currency: 'ILS',
                notes: null,
                displayOrder: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'demo-ac-2',
    userId: 'demo-user-123',
    name: 'פנסיוני',
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    instruments: [
      {
        id: 'demo-inst-2',
        assetClassId: 'demo-ac-2',
        name: 'קרן פנסיה',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        providers: [
          {
            id: 'demo-prov-3',
            instrumentId: 'demo-inst-2',
            name: 'מגדל',
            displayOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            assets: [
              {
                id: 'demo-asset-4',
                providerId: 'demo-prov-3',
                name: 'פנסיה מקיפה',
                isLiquid: false,
                currency: 'ILS',
                notes: null,
                displayOrder: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      },
      {
        id: 'demo-inst-3',
        assetClassId: 'demo-ac-2',
        name: 'קרן השתלמות',
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        providers: [
          {
            id: 'demo-prov-4',
            instrumentId: 'demo-inst-3',
            name: 'אלטשולר שחם',
            displayOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            assets: [
              {
                id: 'demo-asset-5',
                providerId: 'demo-prov-4',
                name: 'קה"ש טכנולוגיה',
                isLiquid: false,
                currency: 'ILS',
                notes: null,
                displayOrder: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'demo-ac-3',
    userId: 'demo-user-123',
    name: 'השקעות',
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    instruments: [
      {
        id: 'demo-inst-4',
        assetClassId: 'demo-ac-3',
        name: 'תיק השקעות',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        providers: [
          {
            id: 'demo-prov-5',
            instrumentId: 'demo-inst-4',
            name: 'מיטב',
            displayOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            assets: [
              {
                id: 'demo-asset-6',
                providerId: 'demo-prov-5',
                name: 'תיק מנוהל',
                isLiquid: true,
                currency: 'ILS',
                notes: null,
                displayOrder: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'demo-ac-4',
    userId: 'demo-user-123',
    name: 'נדל״ן',
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    instruments: [
      {
        id: 'demo-inst-5',
        assetClassId: 'demo-ac-4',
        name: 'דירה',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        providers: [
          {
            id: 'demo-prov-6',
            instrumentId: 'demo-inst-5',
            name: 'תל אביב',
            displayOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            assets: [
              {
                id: 'demo-asset-7',
                providerId: 'demo-prov-6',
                name: 'דירת מגורים',
                isLiquid: false,
                currency: 'ILS',
                notes: null,
                displayOrder: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      },
    ],
  },
]

// Demo values for current and previous months
export const DEMO_VALUES: Record<string, string> = {
  'demo-asset-1': '45000',
  'demo-asset-2': '12000',
  'demo-asset-3': '8500',
  'demo-asset-4': '320000',
  'demo-asset-5': '85000',
  'demo-asset-6': '150000',
  'demo-asset-7': '2500000',
}

export const DEMO_PREVIOUS_VALUES: Record<string, string> = {
  'demo-asset-1': '42000',
  'demo-asset-2': '11500',
  'demo-asset-3': '8000',
  'demo-asset-4': '310000',
  'demo-asset-5': '82000',
  'demo-asset-6': '145000',
  'demo-asset-7': '2450000',
}

export function isDemoMode(userId: string | undefined): boolean {
  return userId === 'demo-user-123'
}
