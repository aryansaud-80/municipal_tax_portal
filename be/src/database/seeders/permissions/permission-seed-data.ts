import { PermissionModule } from '../../../modules/permissions/enums/permission-module.enum';
import { PermissionAction } from '../../../modules/permissions/enums/permission-action.enum';

export interface PermissionSeedDefinition {
  module: PermissionModule;
  action: PermissionAction;
  name: string;
  description: string;
}

const crud = (
  module: PermissionModule,
  label: string,
): PermissionSeedDefinition[] => [
  {
    module,
    action: PermissionAction.CREATE,
    name: `Create ${label}`,
    description: `Allows creating ${label.toLowerCase()}`,
  },
  {
    module,
    action: PermissionAction.VIEW,
    name: `View ${label}`,
    description: `Allows viewing ${label.toLowerCase()}`,
  },
  {
    module,
    action: PermissionAction.UPDATE,
    name: `Update ${label}`,
    description: `Allows updating ${label.toLowerCase()}`,
  },
  {
    module,
    action: PermissionAction.DELETE,
    name: `Delete ${label}`,
    description: `Allows deleting ${label.toLowerCase()}`,
  },
];

export const PERMISSION_SEED_DATA: PermissionSeedDefinition[] = [
  ...crud(PermissionModule.USER, 'Users'),
  {
    module: PermissionModule.USER,
    action: PermissionAction.ASSIGN,
    name: 'Assign User Role',
    description: 'Allows assigning roles to users',
  },
  {
    module: PermissionModule.USER,
    action: PermissionAction.REMOVE,
    name: 'Remove User Role',
    description: 'Allows removing roles from users',
  },

  ...crud(PermissionModule.ROLE, 'Roles'),
  {
    module: PermissionModule.ROLE,
    action: PermissionAction.ASSIGN,
    name: 'Assign Role Permission',
    description: 'Allows assigning permissions to roles',
  },
  {
    module: PermissionModule.ROLE,
    action: PermissionAction.REMOVE,
    name: 'Remove Role Permission',
    description: 'Allows removing permissions from roles',
  },

  ...crud(PermissionModule.PERMISSION, 'Permissions'),

  {
    module: PermissionModule.DASHBOARD,
    action: PermissionAction.VIEW,
    name: 'View Dashboard',
    description: 'Allows viewing the dashboard',
  },

  ...crud(PermissionModule.CITIZEN, 'Citizens'),
  {
    module: PermissionModule.CITIZEN,
    action: PermissionAction.VERIFY,
    name: 'Verify Citizen',
    description: 'Allows verifying citizen identity/documents',
  },

  ...crud(PermissionModule.PROPERTY_TAX, 'Property Tax'),
  {
    module: PermissionModule.PROPERTY_TAX,
    action: PermissionAction.APPROVE,
    name: 'Approve Property Tax',
    description: 'Allows approving property tax assessments',
  },
  {
    module: PermissionModule.PROPERTY_TAX,
    action: PermissionAction.REJECT,
    name: 'Reject Property Tax',
    description: 'Allows rejecting property tax assessments',
  },

  ...crud(PermissionModule.HOUSE_RENT_TAX, 'House Rent Tax'),
  {
    module: PermissionModule.HOUSE_RENT_TAX,
    action: PermissionAction.APPROVE,
    name: 'Approve House Rent Tax',
    description: 'Allows approving house rent tax assessments',
  },

  ...crud(PermissionModule.BUSINESS_TAX, 'Business Tax'),
  {
    module: PermissionModule.BUSINESS_TAX,
    action: PermissionAction.APPROVE,
    name: 'Approve Business Tax',
    description: 'Allows approving business tax assessments',
  },

  ...crud(PermissionModule.LAND_TAX, 'Land Tax'),
  {
    module: PermissionModule.LAND_TAX,
    action: PermissionAction.APPROVE,
    name: 'Approve Land Tax',
    description: 'Allows approving land tax assessments',
  },

  ...crud(PermissionModule.ADVERTISEMENT_TAX, 'Advertisement Tax'),
  {
    module: PermissionModule.ADVERTISEMENT_TAX,
    action: PermissionAction.APPROVE,
    name: 'Approve Advertisement Tax',
    description: 'Allows approving advertisement tax assessments',
  },

  ...crud(PermissionModule.VEHICLE_TAX, 'Vehicle Tax'),
  {
    module: PermissionModule.VEHICLE_TAX,
    action: PermissionAction.APPROVE,
    name: 'Approve Vehicle Tax',
    description: 'Allows approving vehicle tax assessments',
  },

  {
    module: PermissionModule.PAYMENT,
    action: PermissionAction.CREATE,
    name: 'Record Payment',
    description: 'Allows recording a tax payment',
  },
  {
    module: PermissionModule.PAYMENT,
    action: PermissionAction.VIEW,
    name: 'View Payments',
    description: 'Allows viewing payment records',
  },
  {
    module: PermissionModule.PAYMENT,
    action: PermissionAction.VERIFY,
    name: 'Verify Payment',
    description: 'Allows verifying a payment',
  },

  ...crud(PermissionModule.TAX_RULE, 'Tax Rules'),

  ...crud(PermissionModule.BILL, 'Bills'),

  ...crud(PermissionModule.FINE, 'Fines'),

  ...crud(PermissionModule.FISCAL_PERIOD, 'Fiscal Periods'),

  ...crud(PermissionModule.PROPERTY_APPLICATION, 'Property Applications'),
  {
    module: PermissionModule.PROPERTY_APPLICATION,
    action: PermissionAction.APPROVE,
    name: 'Approve Property Application',
    description: 'Allows approving property registration applications',
  },
  {
    module: PermissionModule.PROPERTY_APPLICATION,
    action: PermissionAction.REJECT,
    name: 'Reject Property Application',
    description: 'Allows rejecting property registration applications',
  },

  {
    module: PermissionModule.RECEIPT,
    action: PermissionAction.VIEW,
    name: 'View Receipt',
    description: 'Allows viewing receipts',
  },
  {
    module: PermissionModule.RECEIPT,
    action: PermissionAction.PRINT,
    name: 'Print Receipt',
    description: 'Allows printing receipts',
  },

  {
    module: PermissionModule.REPORT,
    action: PermissionAction.VIEW,
    name: 'View Reports',
    description: 'Allows viewing reports',
  },
  {
    module: PermissionModule.REPORT,
    action: PermissionAction.EXPORT,
    name: 'Export Reports',
    description: 'Allows exporting reports',
  },

  {
    module: PermissionModule.AUDIT_LOG,
    action: PermissionAction.VIEW,
    name: 'View Audit Log',
    description: 'Allows viewing the audit log',
  },

  {
    module: PermissionModule.SETTING,
    action: PermissionAction.VIEW,
    name: 'View Settings',
    description: 'Allows viewing system settings',
  },
  {
    module: PermissionModule.SETTING,
    action: PermissionAction.UPDATE,
    name: 'Update Settings',
    description: 'Allows updating system settings',
  },
];
