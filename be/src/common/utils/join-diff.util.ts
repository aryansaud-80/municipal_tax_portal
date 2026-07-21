export function filterUnassignedIds(
  requestedIds: string[],
  existingIds: Set<string> | string[],
): string[] {
  const existingSet =
    existingIds instanceof Set ? existingIds : new Set(existingIds);
  return requestedIds.filter((id) => !existingSet.has(id));
}
