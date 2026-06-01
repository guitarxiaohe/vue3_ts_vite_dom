import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';

/******************************** 字段配置实体 ********************************/

// 字段配置模块
const entityModule: EntityModule = {
  entityKey: 'fieldConfig',
  form: {
    component: defineAsyncComponent(() => import('./form/index.vue')),
  },
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    entityKey: 'fieldConfig',
    title: '字段配置',

    filters: {
      fields: {
        entityKey: {
          key: 'entityKey',
          label: '实体标识',
          component: 'input',
          placeholder: '请输入实体标识',
          order: 1,
        },
        fieldKey: {
          key: 'fieldKey',
          label: '字段标识',
          component: 'input',
          placeholder: '请输入字段标识',
          order: 2,
        },
        fieldName: {
          key: 'fieldName',
          label: '字段名称',
          component: 'input',
          placeholder: '请输入字段名称',
          order: 3,
        },
        fieldType: {
          key: 'fieldType',
          label: '字段类型',
          component: 'select',
          placeholder: '请选择字段类型',
          order: 4,
          options: [
            { label: '输入框', value: 'input' },
            { label: '数字', value: 'number' },
            { label: '文本域', value: 'textarea' },
            { label: '下拉框', value: 'select' },
            { label: '字典', value: 'dict' },
            { label: '日期', value: 'date' },
            { label: '日期时间', value: 'datetime' },
            { label: '开关', value: 'switch' },
            { label: '文件', value: 'file' },
            { label: '审计人', value: 'by' },
            { label: '用户', value: 'user' },
          ],
        },
      },
    },
    table: {
      rowKey: 'id',
      height: 560,
      pageSize: 20,
      defaultSort: { field: 'sort', order: 'asc' },
      showColumnSettings: true,
    },
    detail: {
      title: '字段配置详情',
      width: '52%',
      visibleCount: 12,
    },
  },
};

export default entityModule;
