<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getListByEntityKeyApi, saveMockDictBundle } from '@/api/modules/user';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import type {
  DictClassValue,
  DictFormData,
  DictItemFormData,
  DictStatusValue,
} from '@/types/dict';

/******************************** 类型定义 ********************************/

interface DictColorOption {
  label: string;
  value: string;
}

/******************************** 常量定义 ********************************/

const DICT_CHILDREN_QUERY_KEY = ['dict-form-items'] as const;

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();
const queryClient = useQueryClient();

/******************************** 基础状态 ********************************/

const parentFormRef = ref<FormInstance>();
const childFormRef = ref<FormInstance>();
const saving = ref<boolean>(false);
const childDrawerVisible = ref<boolean>(false);
const childEditingIndex = ref<number>(-1);
const parentForm = ref<DictFormData>(createDefaultParentForm());
const childForm = ref<DictItemFormData>(createDefaultChildForm());
const childItems = ref<DictItemFormData[]>([]);
const sourceDictType = ref<string>('');

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return t('dictPage.copyTitle');
  }

  return props.isCreate ? t('dictPage.createTitle') : t('dictPage.editTitle');
});

const childDrawerTitle = computed(() =>
  childEditingIndex.value >= 0
    ? t('dictPage.itemEditTitle')
    : t('dictPage.itemCreateTitle')
);

const dictClassOptions = computed<
  Array<{ label: string; value: DictClassValue }>
>(() => [
  { label: t('dictPage.classSystem'), value: 'system' },
  { label: t('dictPage.classBusiness'), value: 'business' },
]);

const colorOptions = computed<DictColorOption[]>(() => [
  { label: t('dictPage.colorGreen'), value: '#b7ebc2' },
  { label: t('dictPage.colorRed'), value: '#ffccc7' },
  { label: t('dictPage.colorOrange'), value: '#ffe58f' },
  { label: t('dictPage.colorBlue'), value: '#91d5ff' },
  { label: t('dictPage.colorPurple'), value: '#d3adf7' },
]);
const childItemsLoading = computed(() => childItemsQuery.isFetching.value);

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

const childRules = computed<FormRules<DictItemFormData>>(() => ({
  dictValue: [
    {
      required: true,
      message: t('validation.enterField', { field: t('dictPage.itemValue') }),
      trigger: 'blur',
    },
  ],
  dictLabel: [
    {
      required: true,
      message: t('validation.enterField', { field: t('dictPage.itemLabel') }),
      trigger: 'blur',
    },
  ],
  color: [
    {
      required: true,
      message: t('validation.selectField', { field: t('dictPage.itemColor') }),
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

// 创建默认子表单
function createDefaultChildForm(): DictItemFormData {
  return {
    localId: createLocalId(),
    dictCode: undefined,
    dictSort: 1,
    dictValue: '',
    dictLabel: '',
    color: '#b7ebc2',
    remark: '',
    status: '0',
  };
}

// 创建本地子表标识
function createLocalId() {
  return `dict-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 规范化状态值
function normalizeStatus(value: unknown): DictStatusValue {
  return String(value ?? '0') === '1' ? '1' : '0';
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
    status: normalizeStatus(source.status),
    remark: String(source.remark ?? ''),
  };
}

// 规范化子表单
function normalizeChildItem(
  record?: Record<string, unknown>,
  index = 0
): DictItemFormData {
  const source = record ?? {};

  return {
    ...createDefaultChildForm(),
    localId:
      String(source.localId ?? source.dictCode ?? '').trim() || createLocalId(),
    dictCode: source.dictCode as number | string | undefined,
    dictSort: Number(source.dictSort ?? index + 1),
    dictValue: String(source.dictValue ?? '').trim(),
    dictLabel: String(source.dictLabel ?? '').trim(),
    color: String(source.color ?? '#b7ebc2'),
    remark: String(source.remark ?? ''),
    status: normalizeStatus(source.status),
  };
}

// 重排子表顺序
function normalizeChildItemsOrder(items: DictItemFormData[]) {
  return items.map((item, index) => ({
    ...item,
    dictSort: index + 1,
  }));
}

// 同步弹窗数据
function syncFormState() {
  parentForm.value = cloneParentForm(props.record);
  sourceDictType.value = String(props.record?.dictType ?? '').trim();
  childItems.value = [];
  childDrawerVisible.value = false;
  childEditingIndex.value = -1;
  childForm.value = createDefaultChildForm();
}

// 获取状态标签
function getStatusLabel(status: DictStatusValue) {
  return status === '0'
    ? t('dictPage.statusEnabled')
    : t('dictPage.statusDisabled');
}

// 获取状态标签类型
function getStatusTagType(status: DictStatusValue) {
  return status === '0' ? 'success' : 'danger';
}

// 打开新增字典值
function openCreateItem() {
  childEditingIndex.value = -1;
  childForm.value = {
    ...createDefaultChildForm(),
    dictSort: childItems.value.length + 1,
  };
  childDrawerVisible.value = true;
}

// 打开编辑字典值
function openEditItem(row: DictItemFormData, index: number) {
  childEditingIndex.value = index;
  childForm.value = normalizeChildItem(row, index);
  childDrawerVisible.value = true;
}

// 提交子表单
async function handleChildSave() {
  try {
    await childFormRef.value?.validate();
  } catch {
    return;
  }

  const payload = normalizeChildItem(
    childForm.value,
    childEditingIndex.value >= 0 ? childEditingIndex.value : childItems.value.length
  );

  const duplicateIndex = childItems.value.findIndex((item, index) => {
    if (index === childEditingIndex.value) {
      return false;
    }

    return item.dictValue === payload.dictValue;
  });

  if (duplicateIndex >= 0) {
    ElMessage.warning(t('dictPage.itemValueDuplicate'));
    return;
  }

  const nextItems = [...childItems.value];

  if (childEditingIndex.value >= 0) {
    nextItems.splice(childEditingIndex.value, 1, payload);
  } else {
    nextItems.push(payload);
  }

  childItems.value = normalizeChildItemsOrder(nextItems);
  childDrawerVisible.value = false;
  childEditingIndex.value = -1;
  childForm.value = createDefaultChildForm();
}

// 删除字典值
async function handleDeleteItem(index: number) {
  try {
    await ElMessageBox.confirm(
      t('dictPage.itemDeleteConfirm'),
      t('common.confirm'),
      {
        type: 'warning',
      }
    );
  } catch {
    return;
  }

  const nextItems = [...childItems.value];
  nextItems.splice(index, 1);
  childItems.value = normalizeChildItemsOrder(nextItems);
}

// 关闭子抽屉
function handleChildCancel() {
  childDrawerVisible.value = false;
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
      status: normalizeStatus(parentForm.value.status),
      remark: String(parentForm.value.remark ?? '').trim(),
    };

    const items = childItems.value.map((item, index) => ({
      dictCode: item.dictCode,
      dictSort: index + 1,
      dictValue: item.dictValue.trim(),
      dictLabel: item.dictLabel.trim(),
      dictType: payload.dictType,
      color: item.color,
      status: normalizeStatus(item.status),
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
      childDrawerVisible.value = false;
      childEditingIndex.value = -1;
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

watch(childDrawerVisible, (visible) => {
  if (visible) {
    return;
  }

  childEditingIndex.value = -1;
  childForm.value = createDefaultChildForm();
  childFormRef.value?.clearValidate();
});
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

            <el-form-item :label="t('dictPage.enabled')" class="dict-form__switch-cell">
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
          <div class="dict-form__section-head">
            <div class="dict-form__section-title">
              {{ t('dictPage.itemSectionTitle') }}
            </div>

            <el-button type="default" @click="openCreateItem">
              {{ t('common.add') }}
            </el-button>
          </div>

          <el-table
            :data="childItems"
            row-key="localId"
            border
            v-loading="childItemsLoading"
            class="dict-form__table"
          >
            <el-table-column
              type="index"
              :label="t('menuPage.sequence')"
              width="72"
              align="center"
            />

            <el-table-column
              prop="dictValue"
              :label="t('dictPage.itemValue')"
              min-width="160"
            />

            <el-table-column
              prop="dictLabel"
              :label="t('dictPage.itemLabel')"
              min-width="180"
            />

            <el-table-column
              prop="color"
              :label="t('dictPage.itemColor')"
              width="140"
              align="center"
            >
              <template #default="{ row }">
                <div class="dict-form__color-cell">
                  <span
                    class="dict-form__color-dot"
                    :style="{ backgroundColor: row.color }"
                  />
                </div>
              </template>
            </el-table-column>

            <el-table-column
              prop="remark"
              :label="t('dictPage.itemRemark')"
              min-width="180"
            >
              <template #default="{ row }">
                {{ row.remark || '—' }}
              </template>
            </el-table-column>

            <el-table-column
              prop="status"
              :label="t('dictPage.enabled')"
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              :label="t('common.operation')"
              width="160"
              fixed="right"
              align="center"
            >
              <template #default="{ row, $index }">
                <el-button link type="primary" @click="openEditItem(row, $index)">
                  {{ t('common.edit') }}
                </el-button>
                <el-button link type="danger" @click="handleDeleteItem($index)">
                  {{ t('common.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
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

    <!-------------------------- 子表编辑抽屉 -------------------------->
    <el-drawer
      :model-value="childDrawerVisible"
      :title="childDrawerTitle"
      size="520px"
      append-to-body
      direction="rtl"
      @update:model-value="childDrawerVisible = $event"
    >
      <div class="dict-form__child-drawer">
        <el-form
          ref="childFormRef"
          :model="childForm"
          :rules="childRules"
          label-position="top"
        >
          <el-form-item :label="t('dictPage.itemValue')" prop="dictValue">
            <el-input
              v-model="childForm.dictValue"
              :placeholder="t('validation.enterField', { field: t('dictPage.itemValue') })"
              clearable
            />
          </el-form-item>

          <el-form-item :label="t('dictPage.itemLabel')" prop="dictLabel">
            <el-input
              v-model="childForm.dictLabel"
              :placeholder="t('validation.enterField', { field: t('dictPage.itemLabel') })"
              clearable
            />
          </el-form-item>

          <el-form-item :label="t('dictPage.itemColor')" prop="color">
            <el-select
              v-model="childForm.color"
              :placeholder="t('validation.selectField', { field: t('dictPage.itemColor') })"
            >
              <el-option
                v-for="item in colorOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div class="dict-form__color-option">
                  <span
                    class="dict-form__color-dot"
                    :style="{ backgroundColor: item.value }"
                  />
                  <span>{{ item.label }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item :label="t('dictPage.itemRemark')">
            <el-input
              v-model="childForm.remark"
              type="textarea"
              :rows="4"
              :placeholder="t('validation.enterField', { field: t('dictPage.itemRemark') })"
            />
          </el-form-item>

          <el-form-item :label="t('dictPage.enabled')">
            <el-switch
              v-model="childForm.status"
              active-value="0"
              inactive-value="1"
            />
          </el-form-item>
        </el-form>

        <div class="dict-form__footer">
          <el-button @click="handleChildCancel">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleChildSave">
            {{ t('common.confirm') }}
          </el-button>
        </div>
      </div>
    </el-drawer>
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

.dict-form__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.dict-form__section-title {
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.dict-form__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 16px;
}

.dict-form__switch-cell {
  min-width: 160px;
}

.dict-form__table {
  width: 100%;
}

.dict-form__color-cell {
  display: flex;
  justify-content: center;
}

.dict-form__color-option {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.dict-form__color-dot {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.dict-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
}

.dict-form__child-drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
