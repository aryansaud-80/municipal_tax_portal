import {
  signCallback,
  verifyCallbackSignature,
} from '../../modules/payments/mock-provider.util';
import { PERMISSION_SEED_DATA } from '../../database/seeders/permissions/permission-seed-data';
import { ROLE_PERMISSION_SEED_DATA } from '../../database/seeders/mappings/role-permission-seed-data';
import { ROLE_SEED_DATA } from '../../database/seeders/roles/role-seed-data';

describe('mock payment provider callbacks', () => {
  it('signs and verifies callbacks; rejects forged signatures', () => {
    const sig = signCallback('MOCK-1', 'success');
    expect(verifyCallbackSignature('MOCK-1', 'success', sig)).toBe(true);
    expect(verifyCallbackSignature('MOCK-1', 'failed', sig)).toBe(false);
    expect(verifyCallbackSignature('MOCK-1', 'success', 'forged')).toBe(false);
    // A redirect alone carries no signature — it can never succeed.
    expect(verifyCallbackSignature('MOCK-1', 'success', '')).toBe(false);
  });
});

describe('RBAC seed consistency', () => {
  const defined = new Set(
    PERMISSION_SEED_DATA.map((p) => `${p.module}.${p.action}`),
  );

  it('every mapped permission code is defined', () => {
    const missing: string[] = [];
    for (const codes of Object.values(ROLE_PERMISSION_SEED_DATA)) {
      for (const code of codes) {
        if (!defined.has(code)) missing.push(code);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every mapped role is defined', () => {
    const roles = new Set(ROLE_SEED_DATA.map((r) => r.code));
    for (const code of Object.keys(ROLE_PERMISSION_SEED_DATA)) {
      expect(roles.has(code)).toBe(true);
    }
  });

  it('all five tax categories have approve permissions defined', () => {
    for (const mod of [
      'propertyTax',
      'houseRentTax',
      'businessTax',
      'landTax',
      'advertisementTax',
    ]) {
      expect(defined.has(`${mod}.approve`)).toBe(true);
    }
  });

  it('citizens cannot verify payments or manage rules', () => {
    const citizen = new Set(ROLE_PERMISSION_SEED_DATA.CITIZEN);
    expect(citizen.has('payment.verify')).toBe(false);
    expect(citizen.has('taxRule.create')).toBe(false);
    expect(citizen.has('bill.delete')).toBe(false);
    expect(citizen.has('user.create')).toBe(false);
  });
});
