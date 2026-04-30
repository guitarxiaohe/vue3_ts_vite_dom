import { computed, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { FormInstance } from 'element-plus';
import { getListByEntityKeyApi, saveMockDictBundle } from '@/api/modules/user';
import type { DictFormData, DictItemFormData } from '@/types/dict';
import type { EntityFormEmits, EntityFormProps } from '@/features/entities/_shared/types';
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
      const payload = buildDictBundlePayload(parentForm.value, childItems.value);

      await saveMockDictBundle({
        previousDictType: previousDictType.value,
        ...payload,
      });

      await queryClient.invalidateQueries({
        queryKey: DICT_CHILDREN_QUERY_KEY,
      });

      emit('save', payload.dict);
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
