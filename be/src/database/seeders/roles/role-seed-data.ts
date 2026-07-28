export interface RoleSeedDefinition {
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
}

export const ROLE_SEED_DATA: RoleSeedDefinition[] = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Full system access across all modules',
    isSystem: true,
  },
  {
    name: 'Municipal Admin',
    code: 'MUNICIPAL_ADMIN',
    description: 'Manages municipal operations, users and settings',
    isSystem: true,
  },
  {
    name: 'Revenue Officer',
    code: 'REVENUE_OFFICER',
    description: 'Assesses and approves tax records',
    isSystem: true,
  },
  {
    name: 'Cashier',
    code: 'CASHIER',
    description: 'Records payments and issues receipts',
    isSystem: true,
  },
  {
    name: 'Auditor',
    code: 'AUDITOR',
    description: 'Read-only access for auditing records and reports',
    isSystem: true,
  },
];
