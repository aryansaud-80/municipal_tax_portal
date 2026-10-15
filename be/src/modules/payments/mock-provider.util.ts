import { createHmac, randomUUID } from 'crypto';

export interface MockCheckout {
  providerRef: string;
  amount: number;
  currency: 'NPR';
  mockCheckoutUrl: string;
  note: string;
}

export function newProviderRef(): string {
  return `MOCK-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function mockSecret(): string {
  return process.env.MOCK_PAY_SECRET ?? 'dev-mock-secret-change-me';
}

/** HMAC signature the mock provider attaches to server callbacks. */
export function signCallback(providerRef: string, status: string): string {
  return createHmac('sha256', mockSecret())
    .update(`${providerRef}|${status}`)
    .digest('hex');
}

export function verifyCallbackSignature(
  providerRef: string,
  status: string,
  signature: string,
): boolean {
  const expected = signCallback(providerRef, status);
  if (signature.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
