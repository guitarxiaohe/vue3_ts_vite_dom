/******************************** 框架级字段类型常量 ********************************/

// 字段类型联合（前后端对齐 field_config.field_type）
export const FIELD_TYPE = {
  INPUT: 'input',
  NUMBER: 'number',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  DICT: 'dict',
  DATE: 'date',
  DATETIME: 'datetime',
  SWITCH: 'switch',
  FILE: 'file',
  BY: 'by',
  USER: 'user',
} as const;

export type FieldType = (typeof FIELD_TYPE)[keyof typeof FIELD_TYPE];

export const FIELD_TYPE_LIST: FieldType[] = Object.values(FIELD_TYPE);

// 字段角色联合（前后端对齐 field_config.field_role）
export const FIELD_ROLE = {
  CREATE_USER: 'createUser',
  UPDATE_USER: 'updateUser',
  FILE_INFO: 'fileInfo',
  NONE: '',
} as const;

export type FieldRole = (typeof FIELD_ROLE)[keyof typeof FIELD_ROLE];

export const FIELD_ROLE_LIST: FieldRole[] = Object.values(FIELD_ROLE);

// 字段类型 → 表单控件映射
export const FIELD_TYPE_TO_FORM_COMPONENT: Record<FieldType, string> = {
  input: 'el-input',
  number: 'el-input-number',
  textarea: 'el-input',
  select: 'el-select',
  dict: 'AsyncSelect',
  date: 'el-date-picker',
  datetime: 'el-date-picker',
  switch: 'el-switch',
  file: 'FileUpload',
  by: 'span',
  user: 'AsyncSelect',
};

// 字段类型 → 表格渲染策略
export const FIELD_TYPE_TO_TABLE_RENDERER: Record<FieldType, string> = {
  input: 'text',
  number: 'number',
  textarea: 'text',
  select: 'dict-select',
  dict: 'dict-select',
  date: 'date',
  datetime: 'datetime',
  switch: 'switch',
  file: 'file',
  by: 'by',
  user: 'user',
};

// 字段类型 → 默认筛选策略
export const FIELD_TYPE_TO_FILTER_COMPONENT: Record<FieldType, string> = {
  input: 'input',
  number: 'input',
  textarea: 'input',
  select: 'select',
  dict: 'async-select',
  date: 'date',
  datetime: 'datetime',
  switch: 'select',
  file: 'input',
  by: 'input',
  user: 'async-select',
};
