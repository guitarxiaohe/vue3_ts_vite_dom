/**
 * 统一读取 mock 开关：优先 VITE_IS_MOCK，兼容 IS_MOCK。
 */
export function isMockEnabled(): boolean {
  const env = (import.meta as any).env ?? {};
  const raw = env.VITE_IS_MOCK ?? env.IS_MOCK ?? false;
  return String(raw).toLowerCase() === 'true';
}
