/**
 * 字典模块类型定义
 */

/******************************** 字典表单 ********************************/

// 字典状态值
export type DictStatusValue = '0' | '1';

// 字典分类值
export type DictClassValue = 'system' | 'business';

// 字典主表表单
export interface DictFormData extends Record<string, unknown> {
  dictId?: number | string;
  dictType: string;
  dictName: string;
  dictClass: DictClassValue;
  status: DictStatusValue;
  remark?: string;
}

/******************************** 字典值表单 ********************************/

// 字典值子表表单
export interface DictItemFormData extends Record<string, unknown> {
  localId: string;
  dictCode?: number | string;
  dictSort: number;
  dictValue: string;
  dictLabel: string;
  color: string;
  remark: string;
  status: DictStatusValue;
}

/******************************** 字典值数据 ********************************/

// 字典值行数据
export interface DictDataItem extends Record<string, unknown> {
  dictCode?: number | string;
  dictSort?: number;
  dictLabel?: string;
  dictValue?: string;
  dictType?: string;
  cssClass?: string;
  listClass?: string;
  color?: string;
  isDefault?: string;
  status?: DictStatusValue | string;
  remark?: string;
}
