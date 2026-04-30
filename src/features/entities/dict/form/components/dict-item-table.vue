<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import {
  ElButton,
  ElMessage,
  ElMessageBox,
  ElTag,
  TableV2FixedDir,
} from 'element-plus';
import { useI18n } from 'vue-i18n';
import TableEntlty from '@/components/table-entity/index.vue';
import type { ColumnsItem } from '@/components/table-entity/index.type';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import type { DetailField } from '@/features/form-shell/types/detail';
import type { DictItemFormData } from '@/types/dict';
import {
  createDefaultDrawerForm,
  getStatusLabel,
  getStatusTagType,
  normalizeDrawerForm,
  normalizeOrder,
  normalizeStatus,
  toItem,
} from '../../shared/utils';

/******************************** 类型定义 ********************************/

interface DictColorOption {
  label: string;
  value: string;
}

interface DictItemTableProps {
  items?: DictItemFormData[];
  loading?: boolean;
  disabled?: boolean;
}

/******************************** 组件入参 ********************************/

const props = withDefaults(defineProps<DictItemTableProps>(), {
  items: () => [],
  loading: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:items', value: DictItemFormData[]): void;
}>();

const { t } = useI18n();

/******************************** 基础状态 ********************************/

const drawerVisible = ref<boolean>(false);
const drawerCreateMode = ref<boolean>(true);
const editingIndex = ref<number>(-1);
const drawerRecord = ref<Record<string, unknown>>();
const drawerFormData = ref<Record<string, unknown>>({});

const drawerTitle = computed(() =>
  drawerCreateMode.value
    ? t('dictPage.itemCreateTitle')
    : t('dictPage.itemEditTitle')
);

const colorOptions = computed<DictColorOption[]>(() => [
  { label: t('dictPage.colorGreen'), value: '#b7ebc2' },
  { label: t('dictPage.colorRed'), value: '#ffccc7' },
  { label: t('dictPage.colorOrange'), value: '#ffe58f' },
  { label: t('dictPage.colorBlue'), value: '#91d5ff' },
  { label: t('dictPage.colorPurple'), value: '#d3adf7' },
]);

const formFields = computed<DetailField[]>(() => [
  {
    prop: 'dictValue',
    label: t('dictPage.itemValue'),
    required: true,
    rules: [
      {
        required: true,
        message: t('validation.enterField', { field: t('dictPage.itemValue') }),
        trigger: 'blur',
      },
    ],
  },
  {
    prop: 'dictLabel',
    label: t('dictPage.itemLabel'),
    required: true,
    rules: [
      {
        required: true,
        message: t('validation.enterField', { field: t('dictPage.itemLabel') }),
        trigger: 'blur',
      },
    ],
  },
  {
    prop: 'color',
    label: t('dictPage.itemColor'),
    type: 'select',
    options: colorOptions.value,
    required: true,
    rules: [
      {
        required: true,
        message: t('validation.selectField', {
          field: t('dictPage.itemColor'),
        }),
        trigger: 'change',
      },
    ],
  },
  {
    prop: 'remark',
    label: t('dictPage.itemRemark'),
    type: 'textarea',
  },
  {
    prop: 'enabled',
    label: t('dictPage.enabled'),
    type: 'switch',
    defaultValue: true,
  },
]);

const tableColumns = computed<ColumnsItem[]>(() => [
  {
    key: 'dictSort',
    dataKey: 'dictSort',
    title: t('menuPage.sequence'),
    width: 88,
  },
  {
    key: 'dictValue',
    dataKey: 'dictValue',
    title: t('dictPage.itemValue'),
    width: 180,
  },
  {
    key: 'dictLabel',
    dataKey: 'dictLabel',
    title: t('dictPage.itemLabel'),
    width: 180,
  },
  {
    key: 'color',
    dataKey: 'color',
    title: t('dictPage.itemColor'),
    width: 140,
    align: 'center' as const,
    cellRenderer: ({ rowData }) =>
      h('div', { class: 'dict-item-table__color-cell' }, [
        h('span', {
          class: 'dict-item-table__color-dot',
          style: { backgroundColor: String(rowData.color ?? '#b7ebc2') },
        }),
      ]),
  },
  {
    key: 'remark',
    dataKey: 'remark',
    title: t('dictPage.itemRemark'),
    width: 180,
    cellRenderer: ({ rowData }) =>
      h('span', {}, String(rowData.remark ?? '') || '—'),
  },
  {
    key: 'status',
    dataKey: 'status',
    title: t('dictPage.enabled'),
    width: 120,
    align: 'center' as const,
    cellRenderer: ({ rowData }) =>
      h(
        ElTag,
        {
          type: getStatusTagType(normalizeStatus(rowData.status)),
        },
        () => getStatusLabel(normalizeStatus(rowData.status), t)
      ),
  },
]);

const actionColumn = computed<ColumnsItem>(() => ({
  key: '__ops__',
  dataKey: '__ops__',
  title: t('common.operation'),
  width: 160,
  align: 'center' as const,
  fixed: TableV2FixedDir.RIGHT,
  cellRenderer: ({ rowData, rowIndex }) =>
    h('div', { class: 'dict-item-table__action-cell' }, [
      h(
        ElButton,
        {
          type: 'primary',
          link: true,
          disabled: props.disabled,
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            openEdit(rowData as DictItemFormData, rowIndex);
          },
        },
        () => t('common.edit')
      ),
      h(
        ElButton,
        {
          type: 'danger',
          link: true,
          disabled: props.disabled,
          onClick: async (event: MouseEvent) => {
            event.stopPropagation();
            await handleDelete(rowIndex);
          },
        },
        () => t('common.delete')
      ),
    ]),
}));

/******************************** 数据方法 ********************************/

// 打开新增抽屉
function openCreate() {
  drawerCreateMode.value = true;
  editingIndex.value = -1;
  drawerRecord.value = undefined;
  drawerFormData.value = {
    ...createDefaultDrawerForm(),
    dictSort: props.items.length + 1,
  };
  drawerVisible.value = true;
}

// 打开编辑抽屉
function openEdit(row: DictItemFormData, index: number) {
  drawerCreateMode.value = false;
  editingIndex.value = index;
  drawerRecord.value = { ...row };
  drawerFormData.value = normalizeDrawerForm(row, index);
  drawerVisible.value = true;
}

// 保存子表记录
function handleSave(data: Record<string, unknown>) {
  const payload = toItem(
    {
      ...(drawerRecord.value ?? {}),
      ...data,
    },
    drawerCreateMode.value ? props.items.length : editingIndex.value
  );

  const duplicateIndex = props.items.findIndex((item, index) => {
    if (!drawerCreateMode.value && index === editingIndex.value) {
      return false;
    }

    return item.dictValue === payload.dictValue;
  });

  if (duplicateIndex >= 0) {
    ElMessage.warning(t('dictPage.itemValueDuplicate'));
    return;
  }

  const nextItems = [...props.items];

  if (drawerCreateMode.value) {
    nextItems.push(payload);
  } else if (editingIndex.value >= 0) {
    nextItems.splice(editingIndex.value, 1, payload);
  }

  emit('update:items', normalizeOrder(nextItems));
  drawerVisible.value = false;
}

// 删除子表记录
async function handleDelete(index: number) {
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

  const nextItems = [...props.items];
  nextItems.splice(index, 1);
  emit('update:items', normalizeOrder(nextItems));
}

// 关闭抽屉
function handleCancel() {
  drawerVisible.value = false;
}

/******************************** 监听 ********************************/

watch(drawerVisible, (visible) => {
  if (visible) {
    return;
  }

  drawerCreateMode.value = true;
  editingIndex.value = -1;
  drawerRecord.value = undefined;
  drawerFormData.value = createDefaultDrawerForm();
});
</script>

<template>
  <div class="dict-item-table">
    <!-------------------------- 子表头部 -------------------------->
    <div class="dict-item-table__head">
      <div class="dict-item-table__title">
        {{ t('dictPage.itemSectionTitle') }}
      </div>

      <el-button
        type="default"
        :disabled="props.loading || props.disabled"
        @click="openCreate"
      >
        {{ t('common.add') }}
      </el-button>
    </div>

    <!-------------------------- 子表列表 -------------------------->
    <div v-loading="props.loading" class="dict-item-table__table-wrap">
      <TableEntlty
        :entity-key="'dictData'"
        :data="props.items"
        :columns="tableColumns"
        :row-action-column="actionColumn"
        :row-key="'localId'"
        :height="320"
        :selectable="false"
        :show-pagination="false"
        :show-column-settings="false"
      />
    </div>

    <!-------------------------- 子表抽屉 -------------------------->
    <DetailDrawer
      v-model:visible="drawerVisible"
      v-model:form-data="drawerFormData"
      :record="drawerRecord"
      :is-create="drawerCreateMode"
      :fields="formFields"
      :columns="1"
      :saving="false"
      :title="drawerTitle"
      :show-navigation="false"
      size="520px"
      :save-text="t('common.confirm')"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped lang="scss">
.dict-item-table__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.dict-item-table__title {
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.dict-item-table__table-wrap {
  min-height: 320px;
}

.dict-item-table__color-cell {
  display: flex;
  justify-content: center;
}

.dict-item-table__color-dot {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.dict-item-table__action-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
