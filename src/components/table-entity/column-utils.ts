import { TableV2FixedDir } from 'element-plus';

/******************************** 列宽与固定列 ********************************/

// 按字段名粗算列宽
export function fontWidth(fint: string | undefined): number {
  if (!fint) return 150;
  return fint.length * 30;
}

// 接口返回的 fixed 字符串转为 TableV2 枚举
export function normalizeColumnFixed(
  v: unknown
): true | TableV2FixedDir | undefined {
  if (v === true) return true;
  if (v === TableV2FixedDir.LEFT || v === 'left') return TableV2FixedDir.LEFT;
  if (v === TableV2FixedDir.RIGHT || v === 'right')
    return TableV2FixedDir.RIGHT;
  return undefined;
}

/******************************** 列插槽命名 ********************************/

// `{dataKey}Col`，与模板插槽名一致
export function colSlotName(dataKey: string): string {
  return `${dataKey}Col`;
}

// 无插槽时的单元格文本展示
export function formatCellText(v: unknown): string {
  if (v == null || v === '') return '';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
