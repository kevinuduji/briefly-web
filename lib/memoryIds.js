export function newMemoryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function migrateMemoryIds(memory) {
  if (!Array.isArray(memory)) return [];
  return memory.map((m, i) => ({
    ...m,
    id: m.id || `mig-${m.date}-${i}`,
  }));
}
