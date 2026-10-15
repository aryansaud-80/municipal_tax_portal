/** Decimal-safe money helpers. All persisted financial math must go through
 * integer-paisa arithmetic — never raw JS floats as the authority. */

export function toPaisa(npr: number | string): number {
  const n = typeof npr === 'string' ? Number(npr) : npr;
  if (!Number.isFinite(n)) throw new Error(`Invalid monetary value: ${npr}`);
  return Math.round(n * 100);
}

export function fromPaisa(paisa: number): number {
  return Math.round(paisa) / 100;
}

export function roundNpr(npr: number | string): number {
  return fromPaisa(toPaisa(npr));
}

export function addNpr(a: number | string, b: number | string): number {
  return fromPaisa(toPaisa(a) + toPaisa(b));
}

export function subNpr(a: number | string, b: number | string): number {
  return fromPaisa(toPaisa(a) - toPaisa(b));
}

export function percentOf(
  base: number | string,
  percent: number | string,
): number {
  return fromPaisa(Math.round((toPaisa(base) * Number(percent)) / 100));
}
