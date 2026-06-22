import { describe, expect, it } from 'vitest';
import { resolveBackendFilterFields } from './resolve-entity-filters';
import type { FieldConfig } from '@/types/user';

describe('resolveBackendFilterFields', () => {
  it('uses backend select value/label mapping for entity async-select filters', () => {
    const fields = resolveBackendFilterFields({
      entityKey: 'chatQuestion',
      backendFields: [
        {
          id: 1,
          entityKey: 'chatQuestion',
          fieldKey: 'category',
          fieldName: '分类编码',
          labelKey: null,
          fieldType: 'select',
          dictCode: null,
          selectEntityKey: 'chatCategory',
          selectValueField: 'category_code',
          selectLabelField: 'category_name',
          sort: 1,
          isFuzzySearch: true,
          isVisible: true,
          createdBy: null,
          createdTime: null,
          updatedBy: null,
          updatedTime: null,
          fixed: null,
        } satisfies FieldConfig,
      ],
      t: (key) => key,
    });

    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({
      key: 'category',
      component: 'async-select',
      valueKey: 'category_code',
      labelKey: 'category_name',
      entityConfig: {
        entityKey: 'chatCategory',
      },
    });
  });
});
