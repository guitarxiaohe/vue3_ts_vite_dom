import { computed, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { FormInstance } from 'element-plus';
import { getListByEntityKeyApi } from '@/api/modules/user';
import {
  addDictType,
  updateDictType,
  addDictData,
  updateDictData,
  deleteDictData,
} from '@/api/modules/dict';
import type { DictFormData, DictItemFormData } from '@/types/dict';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import {
  buildDictBundlePayload,
  cloneParentForm,
  createDefaultParentForm,
  normalizeChildItem,
} from '../shared/utils';

const DICT_CHILDREN_QUERY_KEY = ['dict-form-items'] as const;

export function useDictBundleForm(
  props: EntityFormProps,
  emit: EntityFormEmits,
  parentFormRef: ReturnType<typeof ref<FormInstance | undefined>>
) {
  const queryClient = useQueryClient();
  const saving = ref<boolean>(false);
  const parentForm = ref<DictFormData>(createDefaultParentForm());
  const childItems = ref<DictItemFormData[]>([]);
  const originalChildItems = ref<DictItemFormData[]>([]);
  const queryDictType = ref<string>('');
  const previousDictType = ref<string>('');

  const childItemsQuery = useQuery({
    queryKey: computed(
      () => [...DICT_CHILDREN_QUERY_KEY, queryDictType.value] as const
    ),
    queryFn: async () => {
      const response = (await getListByEntityKeyApi('dictData', {
        pageNum: 1,
        pageSize: 200,
        dictType: queryDictType.value,
        orderByColumn: 'dictSort',
        isAsc: 'asc',
      })) as {
        rows?: Array<Record<string, unknown>>;
      };

      return (response.rows ?? []).map((item, index) =>
        normalizeChildItem(item, index)
      );
    },
    enabled: computed(() => props.visible && Boolean(queryDictType.value)),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 0,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const childItemsLoading = computed(() => childItemsQuery.isFetching.value);

  function syncFormState(record?: Record<string, unknown>) {
    const recordDictType = String(record?.dictType ?? '').trim();

    parentForm.value = cloneParentForm(record);
    queryDictType.value = recordDictType;
    previousDictType.value = props.isCreate ? '' : recordDictType;
    childItems.value = [];
  }

  function clearParentValidation() {
    parentFormRef.value?.clearValidate();
  }

  async function validateParentForm() {
    await parentFormRef.value?.validate();
  }

  async function handleSave() {
    saving.value = true;

    try {
      const payload = buildDictBundlePayload(
        parentForm.value,
        childItems.value
      );

      // 1. 保存字典类型（新增或更新）
      const isCreate = !payload.dict.dictId;
      if (isCreate) {
        await addDictType(payload.dict as unknown as Record<string, unknown>);
      } else {
        await updateDictType(
          payload.dict as unknown as Record<string, unknown>
        );
      }

      // 2. 如果 dictType 变更，先删除旧类型的子表数据
      const prevType = String(previousDictType.value ?? '');
      const newType = String(payload.dict.dictType ?? '');
      if (prevType && prevType !== newType) {
        // dictType 变更时，旧数据同步更新需要调用 refreshCache
      }

      // 3. 删除被移除的子表项
      const currentCodes = new Set(
        payload.items
          .filter((item) => item.dictCode)
          .map((item) => Number(item.dictCode))
      );
      const removedCodes = originalChildItems.value
        .filter(
          (item) => item.dictCode && !currentCodes.has(Number(item.dictCode))
        )
        .map((item) => Number(item.dictCode));
      if (removedCodes.length) {
        await deleteDictData(removedCodes as number[]);
      }

      // 4. 保存子表字典值
      const validItems = payload.items.filter((item) =>
        String(item.dictValue ?? '').trim()
      );
      for (const item of validItems) {
        const itemData = { ...item, dictType: newType };
        if (item.dictCode) {
          await updateDictData(itemData as unknown as Record<string, unknown>);
        } else {
          await addDictData(itemData as unknown as Record<string, unknown>);
        }
      }

      await queryClient.invalidateQueries({
        queryKey: DICT_CHILDREN_QUERY_KEY,
      });

      emit('save', payload.dict as unknown as Record<string, unknown>);
      emit('update:visible', false);
    } finally {
      saving.value = false;
    }
  }

  watch(
    () => props.visible,
    (visible) => {
      if (!visible) {
        return;
      }

      syncFormState(props.record);

      // 每次打开抽屉强制刷新子表数据（避免缓存导致第二次编辑无数据）
      if (queryDictType.value) {
        queryClient.invalidateQueries({
          queryKey: [...DICT_CHILDREN_QUERY_KEY, queryDictType.value],
        });
        childItemsQuery.refetch();
      }
    },
    { immediate: true }
  );

  watch(
    () => childItemsQuery.data.value,
    (value) => {
      if (!props.visible) {
        return;
      }

      if (!queryDictType.value) {
        childItems.value = [];
        return;
      }

      childItems.value = value?.map((item) => ({ ...item })) ?? [];
      originalChildItems.value = value?.map((item) => ({ ...item })) ?? [];
    },
    { immediate: true }
  );

  return {
    saving,
    parentForm,
    childItems,
    childItemsLoading,
    syncFormState,
    clearParentValidation,
    validateParentForm,
    handleSave,
  };
}
