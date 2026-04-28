<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { type FormInstance, type FormRules } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getListByEntityKeyApi, saveMockDictBundle } from '@/api/modules/user';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import type { DictClassValue, DictFormData, DictItemFormData } from '@/types/dict';
import DictItemTable from './components/dict-item-table.vue';

/******************************** 常量定义 ********************************/

const DICT_CHILDREN_QUERY_KEY = ['dict-form-items'] as const;

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();
const queryClient = useQueryClient();

/******************************** 基础状态 ********************************/

const parentFormRef = ref<FormInstance>();
const saving = ref<boolean>(false);
const parentForm = ref<DictFormData>(createDefaultParentForm());
const childItems = ref<DictItemFormData[]>([]);
const sourceDictType = ref<string>('');

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return t('dictPage.copyTitle');
  }

  return props.isCreate ? t('dictPage.createTitle') : t('dictPage.editTitle');
});

const dictClassOptions = computed<
  Array<{ label: string; value: DictClassValue }>
>(() => [
  { label: t('dictPage.classSystem'), value: 'system' },
  { label: t('dictPage.classBusiness'), value: 'business' },
]);

const parentRules = computed<FormRules<DictFormData>>(() => ({
  dictType: [
    {
      required: true,
      message: t('validation.enterField', { field: t('dictPage.dictType') }),
      trigger: 'blur',
    },
  ],
  dictName: [
    {
      required: true,
      message: t('validation.enterField', { field: t('dictPage.dictName') }),
      trigger: 'blur',
    },
  ],
  dictClass: [
    {
      required: true,
      message: t('validation.selectField', { field: t('dictPage.dictClass') }),
      trigger: 'change',
    },
  ],
}));

const childItemsQuery = useQuery({
  queryKey: computed(
    () => [...DICT_CHILDREN_QUERY_KEY, sourceDictType.value] as const
  ),
  queryFn: async () => {
    const response = (await getListByEntityKeyApi('dictData', {
      pageNum: 1,
      pageSize: 200,
      dictType: sourceDictType.value,
      orderByColumn: 'dictSort',
      isAsc: 'asc',
    })) as {
      rows?: Array<Record<string, unknown>>;
    };

    return (response.rows ?? []).map((item, index) =>
      normalizeChildItem(item, index)
    );
  },
  enabled: computed(() => props.visible && Boolean(sourceDictType.value)),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 0,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
});

const childItemsLoading = computed(() => childItemsQuery.isFetching.value);

/******************************** 数据方法 ********************************/

// 创建默认主表单
function createDefaultParentForm(): DictFormData {
  return {
    dictId: undefined,
    dictType: '',
    dictName: '',
    dictClass: 'system',
    status: '0',
    remark: '',
  };
}

// 规范化主表单
function cloneParentForm(record?: Record<string, unknown>): DictFormData {
  const source = record ?? {};

  return {
    ...createDefaultParentForm(),
    dictId: source.dictId as number | string | undefined,
    dictType: String(source.dictType ?? '').trim(),
    dictName: String(source.dictName ?? '').trim(),
    dictClass: (String(source.dictClass ?? 'system') as DictClassValue) || 'system',
    status: String(source.status ?? '0') === '1' ? '1' : '0',
    remark: String(source.remark ?? ''),
  };
}

// 规范化子表记录
function normalizeChildItem(
  record?: Record<string, unknown>,
  index = 0
): DictItemFormData {
  const source = record ?? {};

  return {
    localId:
      String(source.localId ?? source.dictCode ?? '').trim() ||
      `dict-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dictCode: source.dictCode as number | string | undefined,
    dictSort: Number(source.dictSort ?? index + 1),
    dictValue: String(source.dictValue ?? '').trim(),
    dictLabel: String(source.dictLabel ?? '').trim(),
    color: String(source.color ?? '#b7ebc2'),
    remark: String(source.remark ?? ''),
    status: String(source.status ?? '0') === '1' ? '1' : '0',
  };
}

// 同步弹窗数据
function syncFormState() {
  parentForm.value = cloneParentForm(props.record);
  sourceDictType.value = String(props.record?.dictType ?? '').trim();
  childItems.value = [];
}

// 提交主表单
async function handleSave() {
  try {
    await parentFormRef.value?.validate();
  } catch {
    return;
  }

  saving.value = true;

  try {
    const payload = {
      dictId: parentForm.value.dictId,
      dictType: parentForm.value.dictType.trim(),
      dictName: parentForm.value.dictName.trim(),
      dictClass: parentForm.value.dictClass,
      status: String(parentForm.value.status ?? '0') === '1' ? '1' : '0',
      remark: String(parentForm.value.remark ?? '').trim(),
    };

    const items = childItems.value.map((item, index) => ({
      dictCode: item.dictCode,
      dictSort: index + 1,
      dictValue: item.dictValue.trim(),
      dictLabel: item.dictLabel.trim(),
      dictType: payload.dictType,
      color: item.color,
      status: String(item.status ?? '0') === '1' ? '1' : '0',
      remark: String(item.remark ?? '').trim(),
    }));

    await saveMockDictBundle({
      previousDictType: sourceDictType.value,
      dict: payload,
      items,
    });

    await queryClient.invalidateQueries({
      queryKey: DICT_CHILDREN_QUERY_KEY,
    });

    emit('save', payload);
    emit('update:visible', false);
  } finally {
    saving.value = false;
  }
}

// 关闭主抽屉
function handleCancel() {
  emit('update:visible', false);
  emit('cancel');
}

/******************************** 监听 ********************************/

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return;
    }

    syncFormState();
  },
  { immediate: true }
);

watch(
  () => childItemsQuery.data.value,
  (value) => {
    if (!props.visible) {
      return;
    }

    if (!sourceDictType.value) {
      childItems.value = [];
      return;
    }

    childItems.value = value?.map((item) => ({ ...item })) ?? [];
  },
  { immediate: true }
);
</script>

<template>
  <el-drawer
    :model-value="props.visible"
    :title="drawerTitle"
    size="1120px"
    direction="rtl"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="dict-form">
      <!-------------------------- 主内容 -------------------------->
      <div class="dict-form__content">
        <!-------------------------- 主表信息 -------------------------->
        <section class="dict-form__card">
          <div class="dict-form__section-title">
            {{ t('dictPage.basicSectionTitle') }}
          </div>

          <el-form
            ref="parentFormRef"
            :model="parentForm"
            :rules="parentRules"
            label-position="top"
            class="dict-form__grid"
          >
            <el-form-item :label="t('dictPage.dictType')" prop="dictType">
              <el-input
                v-model="parentForm.dictType"
                :placeholder="t('validation.enterField', { field: t('dictPage.dictType') })"
                clearable
              />
            </el-form-item>

            <el-form-item :label="t('dictPage.dictName')" prop="dictName">
              <el-input
                v-model="parentForm.dictName"
                :placeholder="t('validation.enterField', { field: t('dictPage.dictName') })"
                clearable
              />
            </el-form-item>

            <el-form-item :label="t('dictPage.dictClass')" prop="dictClass">
              <el-select
                v-model="parentForm.dictClass"
                :placeholder="t('validation.selectField', { field: t('dictPage.dictClass') })"
              >
                <el-option
                  v-for="item in dictClassOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              :label="t('dictPage.enabled')"
              class="dict-form__switch-cell"
            >
              <el-switch
                v-model="parentForm.status"
                active-value="0"
                inactive-value="1"
              />
            </el-form-item>
          </el-form>
        </section>

        <!-------------------------- 子表信息 -------------------------->
        <section class="dict-form__card">
          <DictItemTable
            :items="childItems"
            :loading="childItemsLoading"
            @update:items="childItems = $event"
          />
        </section>
      </div>

      <!-------------------------- 底部操作 -------------------------->
      <div class="dict-form__footer">
        <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ t('common.save') }}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.dict-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dict-form__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dict-form__card {
  border-radius: 18px;
  padding: 20px 22px;
  background: var(--color-bg-card);
  border: 1px solid var(--el-border-color-lighter);
}

.dict-form__section-title {
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.dict-form__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 16px;
}

.dict-form__switch-cell {
  min-width: 160px;
}

.dict-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
}

@media (max-width: 960px) {
  .dict-form__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .dict-form__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
