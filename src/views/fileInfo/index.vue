<template>
  <div class="file-info">
    <div class="file-info__toolbar">
      <el-form :inline="true" class="file-info__search" @submit.prevent>
        <el-form-item :label="t('fileInfo.createBy')">
          <el-input
            v-model="createByFilter"
            clearable
            :placeholder="t('fileInfo.createByPlaceholder')"
            style="width: 200px"
            @keyup.enter="reloadTable"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reloadTable">
            {{ t('common.search') }}
          </el-button>
          <el-button @click="reloadTable">{{ t('common.refresh') }}</el-button>
        </el-form-item>
      </el-form>
      <div class="file-info__actions">
        <el-button type="primary" @click="openAdd">{{ t('common.add') }}</el-button>
        <el-button :disabled="selectedKeys.length !== 1" @click="openEdit">
          {{ t('common.edit') }}
        </el-button>
        <el-button
          type="danger"
          :disabled="selectedKeys.length === 0"
          @click="handleDelete"
        >
          {{ t('common.delete') }}
        </el-button>
      </div>
    </div>

    <TableEntity
      ref="tableRef"
      :data="fetchFileList"
      :data-params="listParams"
      :columns="columns"
      row-key="fileId"
      :width="tableWidth"
      :height="420"
      v-model:current-page="page"
      v-model:selected-keys="selectedKeys"
      :page-size="pageSize"
      show-pagination
      selectable
      multiple
    />

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item v-if="isEdit" :label="t('fileInfo.column.fileId')">
          <el-input v-model.number="form.fileId" disabled />
        </el-form-item>
        <el-form-item :label="t('fileInfo.column.fileOriginName')" prop="fileOriginName">
          <el-input v-model="form.fileOriginName" />
        </el-form-item>
        <el-form-item :label="t('fileInfo.column.fileSuffix')" prop="fileSuffix">
          <el-input v-model="form.fileSuffix" />
        </el-form-item>
        <el-form-item :label="t('fileInfo.column.fileSizeInfo')" prop="fileSizeInfo">
          <el-input v-model="form.fileSizeInfo" />
        </el-form-item>
        <el-form-item :label="t('fileInfo.column.fileObjectName')" prop="fileObjectName">
          <el-input v-model="form.fileObjectName" />
        </el-form-item>
        <el-form-item :label="t('fileInfo.column.filePath')" prop="filePath">
          <el-input v-model="form.filePath" />
        </el-form-item>
        <el-form-item :label="t('fileInfo.column.delFlag')" prop="delFlag">
          <el-select v-model="form.delFlag" style="width: 100%">
            <el-option :label="t('fileInfo.delFlagN')" value="N" />
            <el-option :label="t('fileInfo.delFlagY')" value="Y" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import TableEntity from '@/components/table-entity/index.vue';
import type { ColumnsItem, TableListQuery } from '@/components/table-entity/index.type';
import type { SysFileInfo } from '@/types/fileInfo';
import {
  addFileInfo,
  assertAjaxOk,
  deleteFileInfo,
  getFileInfo,
  listFileInfo,
  updateFileInfo,
} from '@/api/modules/fileInfo';

const { t } = useI18n();

const tableRef = ref<InstanceType<typeof TableEntity>>();
const formRef = ref<FormInstance>();

/** 列表接口要求带 createBy；可按实际登录用户修改 */
const createByFilter = ref('admin');
const page = ref(1);
const pageSize = ref(10);
const selectedKeys = ref<(number | string)[]>([]);
const tableWidth = ref(1100);

const listParams = computed(() => ({
  createBy: createByFilter.value,
}));

/** 表格异步数据源：分页 + 筛选参数由 TableEntity 合并传入 */
async function fetchFileList(query: TableListQuery) {
  const res = (await listFileInfo(query)) as {
    code?: number;
    msg?: string;
    total?: number;
    rows?: Record<string, unknown>[];
  };
  assertAjaxOk(res);
  return {
    total: Number(res.total ?? 0),
    rows: (res.rows ?? []) as Record<string, any>[],
  };
}

const columns = computed<ColumnsItem[]>(() => [
  {
    key: 'fileId',
    dataKey: 'fileId',
    title: t('fileInfo.column.fileId'),
    width: 100,
  },
  {
    key: 'fileOriginName',
    dataKey: 'fileOriginName',
    title: t('fileInfo.column.fileOriginName'),
    width: 180,
  },
  {
    key: 'fileSuffix',
    dataKey: 'fileSuffix',
    title: t('fileInfo.column.fileSuffix'),
    width: 100,
  },
  {
    key: 'fileSizeInfo',
    dataKey: 'fileSizeInfo',
    title: t('fileInfo.column.fileSizeInfo'),
    width: 120,
  },
  {
    key: 'fileObjectName',
    dataKey: 'fileObjectName',
    title: t('fileInfo.column.fileObjectName'),
    width: 180,
  },
  {
    key: 'filePath',
    dataKey: 'filePath',
    title: t('fileInfo.column.filePath'),
    width: 220,
  },
  {
    key: 'delFlag',
    dataKey: 'delFlag',
    title: t('fileInfo.column.delFlag'),
    width: 90,
  },
]);

function emptyForm(): SysFileInfo {
  return {
    fileOriginName: '',
    fileSuffix: '',
    fileSizeInfo: '',
    fileObjectName: '',
    filePath: '',
    delFlag: 'N',
  };
}

const form = ref<SysFileInfo>(emptyForm());
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);

const dialogTitle = computed(() =>
  isEdit.value ? t('fileInfo.dialog.edit') : t('fileInfo.dialog.add')
);

const formRules = computed<FormRules<SysFileInfo>>(() => ({
  fileOriginName: [
    { required: true, message: t('validation.required', { field: t('fileInfo.column.fileOriginName') }), trigger: 'blur' },
  ],
}));

function resetForm() {
  form.value = emptyForm();
  formRef.value?.clearValidate();
}

function reloadTable() {
  if (!createByFilter.value?.trim()) {
    ElMessage.warning(t('fileInfo.createByRequired'));
    return;
  }
  tableRef.value?.reload();
}

function openAdd() {
  if (!createByFilter.value?.trim()) {
    ElMessage.warning(t('fileInfo.createByRequired'));
    return;
  }
  isEdit.value = false;
  resetForm();
  form.value.createBy = createByFilter.value.trim();
  dialogVisible.value = true;
}

async function openEdit() {
  if (selectedKeys.value.length !== 1) {
    ElMessage.warning(t('fileInfo.selectOneToEdit'));
    return;
  }
  const id = selectedKeys.value[0];
  try {
    const res = (await getFileInfo(id)) as {
      code?: number;
      data?: SysFileInfo;
      msg?: string;
    };
    assertAjaxOk(res);
    isEdit.value = true;
    form.value = { ...emptyForm(), ...res.data };
    dialogVisible.value = true;
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : String(e));
  }
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      const res = await updateFileInfo(form.value);
      assertAjaxOk(res as { code?: number; msg?: string });
      ElMessage.success(t('common.success'));
    } else {
      const res = await addFileInfo(form.value);
      assertAjaxOk(res as { code?: number; msg?: string });
      ElMessage.success(t('common.success'));
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
    selectedKeys.value = [];
    tableRef.value?.clearSelection();
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : String(e));
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete() {
  if (selectedKeys.value.length === 0) {
    ElMessage.warning(t('common.pleaseSelect'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirm'), {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    const res = await deleteFileInfo(selectedKeys.value);
    assertAjaxOk(res as { code?: number; msg?: string });
    ElMessage.success(t('common.success'));
    selectedKeys.value = [];
    tableRef.value?.clearSelection();
    tableRef.value?.reload();
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : String(e));
  }
}

onMounted(() => {
  tableWidth.value = Math.min(
    typeof window !== 'undefined' ? window.innerWidth - 80 : 1100,
    1400
  );
});
</script>

<style scoped>
.file-info {
  padding: 16px;
}

.file-info__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.file-info__search {
  margin-bottom: 0;
}

.file-info__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
