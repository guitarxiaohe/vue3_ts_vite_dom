<template>
  <div class="gen-page">
    <!-------------------------- 页面头部 -------------------------->
    <section class="gen-page__header">
      <div>
        <h2 class="gen-page__title">{{ t('tool.gen.title') }}</h2>
        <p class="gen-page__subtitle">{{ t('tool.gen.desc') }}</p>
      </div>
      <div class="gen-page__header-actions">
        <el-button type="primary" @click="openImportDialog">
          {{ t('tool.gen.importTable') }}
        </el-button>
        <el-button @click="reloadTable">{{ t('common.refresh') }}</el-button>
      </div>
    </section>

    <!-------------------------- 列表区域 -------------------------->
    <section class="gen-page__table">
      <TableEntity
        ref="tableRef"
        v-model:selected-keys="selectedKeys"
        v-model:current-page="currentPage"
        :data="fetchTableList"
        :columns="columns"
        :row-action-column="rowActionColumn"
        row-key="tableId"
        :page-size="pageSize"
        :height="560"
        selectable
        multiple
        show-pagination
      />
    </section>

    <!-------------------------- 导入表弹窗 -------------------------->
    <el-dialog
      v-model="importDialogVisible"
      :title="t('tool.gen.importTable')"
      width="720px"
      destroy-on-close
    >
      <div class="gen-page__import-dialog">
        <el-input
          v-model="dbSearchKeyword"
          :placeholder="t('common.enterKeyword')"
          clearable
          @input="onDbSearch"
        />
        <TableEntity
          ref="dbTableRef"
          v-model:selected-keys="dbSelectedKeys"
          v-model:current-page="dbCurrentPage"
          :data="fetchDbTableList"
          :columns="dbColumns"
          row-key="tableName"
          :page-size="10"
          :height="380"
          selectable
          multiple
          show-pagination
        />
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">{{
          t('common.cancel')
        }}</el-button>
        <el-button type="primary" :loading="importing" @click="doImport">
          {{ t('tool.gen.importTable') }}
        </el-button>
      </template>
    </el-dialog>

    <!-------------------------- 编辑配置弹窗 -------------------------->
    <el-dialog
      v-model="editDialogVisible"
      :title="t('tool.gen.editConfig')"
      width="800px"
      destroy-on-close
    >
      <div v-if="editingTable" class="gen-page__edit-dialog">
        <el-form
          :model="editingTable"
          label-position="top"
          class="gen-page__edit-form"
        >
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('tool.gen.tableName')">
                <el-input :model-value="editingTable.tableName" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('tool.gen.tableComment')">
                <el-input :model-value="editingTable.tableComment" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('tool.gen.className')">
                <el-input v-model="editingTable.className" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('tool.gen.functionAuthor')">
                <el-input v-model="editingTable.functionAuthor" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item :label="t('tool.gen.packageName')">
                <el-input v-model="editingTable.packageName" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="t('tool.gen.moduleName')">
                <el-input v-model="editingTable.moduleName" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="t('tool.gen.businessName')">
                <el-input v-model="editingTable.businessName" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('tool.gen.functionName')">
                <el-input v-model="editingTable.functionName" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('tool.gen.genType')">
                <el-radio-group v-model="editingTable.genType">
                  <el-radio value="0"
                    >ZIP {{ t('tool.gen.download') }}</el-radio
                  >
                  <el-radio value="1">{{ t('tool.gen.customPath') }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item
            v-if="editingTable.genType === '1'"
            :label="t('tool.gen.genPath')"
          >
            <el-input v-model="editingTable.genPath" />
          </el-form-item>

          <!-------------------------- 列配置 -------------------------->
          <el-divider>{{ t('tool.gen.columnConfig') }}</el-divider>
          <el-table :data="editingColumns" max-height="360" size="small">
            <el-table-column
              prop="columnName"
              :label="t('tool.gen.columnName')"
              width="130"
            />
            <el-table-column
              prop="columnComment"
              :label="t('tool.gen.columnComment')"
              min-width="120"
            />
            <el-table-column
              prop="javaType"
              :label="t('tool.gen.javaType')"
              width="100"
            />
            <el-table-column
              prop="javaField"
              :label="t('tool.gen.javaField')"
              width="120"
            />
            <el-table-column
              :label="t('tool.gen.isList')"
              width="60"
              align="center"
            >
              <template #default="{ row }">
                <el-checkbox
                  v-model="row.isList"
                  true-value="1"
                  false-value="0"
                />
              </template>
            </el-table-column>
            <el-table-column
              :label="t('tool.gen.isQuery')"
              width="60"
              align="center"
            >
              <template #default="{ row }">
                <el-checkbox
                  v-model="row.isQuery"
                  true-value="1"
                  false-value="0"
                />
              </template>
            </el-table-column>
            <el-table-column
              :label="t('tool.gen.isEdit')"
              width="60"
              align="center"
            >
              <template #default="{ row }">
                <el-checkbox
                  v-model="row.isEdit"
                  true-value="1"
                  false-value="0"
                />
              </template>
            </el-table-column>
            <el-table-column :label="t('tool.gen.fieldType')" width="120">
              <template #default="{ row }">
                <el-select v-model="row.htmlType" size="small">
                  <el-option label="输入框" value="input" />
                  <el-option label="数字" value="number" />
                  <el-option label="文本域" value="textarea" />
                  <el-option label="下拉框" value="select" />
                  <el-option label="字典" value="dict" />
                  <el-option label="日期" value="date" />
                  <el-option label="日期时间" value="datetime" />
                  <el-option label="开关" value="switch" />
                  <el-option label="文件" value="file" />
                  <el-option label="审计人" value="by" />
                  <el-option label="用户选择" value="user" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="t('tool.gen.dictType')" width="140">
              <template #default="{ row }">
                <el-input
                  v-if="row.htmlType === 'dict'"
                  v-model="row.dictType"
                  size="small"
                  placeholder="dict_code"
                />
                <span
                  v-else
                  style="color: var(--color-text-disabled); font-size: 12px"
                  >--</span
                >
              </template>
            </el-table-column>
            <el-table-column :label="t('tool.gen.selectEntityKey')" width="130">
              <template #default="{ row }">
                <el-input
                  v-if="row.htmlType === 'select'"
                  v-model="row.selectEntityKey"
                  size="small"
                  placeholder="entityKey"
                />
                <span
                  v-else
                  style="color: var(--color-text-disabled); font-size: 12px"
                  >--</span
                >
              </template>
            </el-table-column>
            <el-table-column :label="t('tool.gen.fieldRole')" width="130">
              <template #default="{ row }">
                <el-select
                  v-model="row.fieldRole"
                  size="small"
                  clearable
                  placeholder="角色"
                >
                  <el-option label="创建人" value="createUser" />
                  <el-option label="更新人" value="updateUser" />
                  <el-option label="文件关联" value="fileInfo" />
                  <el-option :label="t('common.no')" value="" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="t('tool.gen.queryType')" width="110">
              <template #default="{ row }">
                <el-select v-model="row.queryType" size="small">
                  <el-option label="=" value="EQ" />
                  <el-option label="!=" value="NE" />
                  <el-option label=">" value="GT" />
                  <el-option label=">=" value="GTE" />
                  <el-option label="<" value="LT" />
                  <el-option label="<=" value="LTE" />
                  <el-option label="LIKE" value="LIKE" />
                  <el-option label="BETWEEN" value="BETWEEN" />
                </el-select>
              </template>
            </el-table-column>
          </el-table>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="editDialogVisible = false">{{
          t('common.cancel')
        }}</el-button>
        <el-button type="primary" :loading="saving" @click="doSaveConfig">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-------------------------- 代码预览弹窗 -------------------------->
    <el-dialog
      v-model="previewDialogVisible"
      :title="t('tool.gen.preview')"
      width="900px"
      destroy-on-close
    >
      <div class="gen-page__preview-dialog">
        <el-tabs v-model="previewTab" type="card">
          <el-tab-pane
            v-for="(code, filename) in previewData"
            :key="filename"
            :label="filename"
            :name="filename"
          >
            <pre class="gen-page__code"><code>{{ code }}</code></pre>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import TableEntity from '@/components/table-entity/index.vue';
import type {
  ColumnsItem,
  TableListQuery,
} from '@/components/table-entity/index.type';
import type { RowActionRenderConfig } from '@/features/entities/_shared/row-actions-types';
import ActionColumn from '@/features/multiview/components/action-column.vue';
import {
  listGenTable,
  getGenTable,
  listDbTable,
  importTable,
  updateGenTable,
  deleteGenTable,
  previewCode,
} from '@/api/modules/tool';

/******************************** 基础状态 ********************************/

const { t } = useI18n();
const tableRef = ref<InstanceType<typeof TableEntity>>();
const dbTableRef = ref<InstanceType<typeof TableEntity>>();
const currentPage = ref(1);
const pageSize = 20;
const selectedKeys = ref<Array<number | string>>([]);
const saving = ref(false);
const importing = ref(false);

/******************************** 代码生成列表 ********************************/

const columns = computed<ColumnsItem[]>(() => [
  {
    key: 'tableName',
    dataKey: 'tableName',
    title: t('tool.gen.tableName'),
    width: 180,
  },
  {
    key: 'tableComment',
    dataKey: 'tableComment',
    title: t('tool.gen.tableComment'),
    width: 160,
  },
  {
    key: 'className',
    dataKey: 'className',
    title: t('tool.gen.className'),
    width: 150,
  },
  {
    key: 'functionName',
    dataKey: 'functionName',
    title: t('tool.gen.functionName'),
    width: 140,
  },
  {
    key: 'createTime',
    dataKey: 'createTime',
    title: t('tool.gen.updateTime'),
    width: 160,
    cellRenderer: ({ cellData }: any) => h('span', formatTime(cellData)),
  },
]);

/******************************** 行操作 ********************************/

const rowActions = {
  preview: async (row?: Record<string, any>) => {
    if (!row?.tableId) return;
    const res = (await previewCode(row.tableId)) as any;
    if (res?.code === 200 && res?.data) {
      previewData.value = res.data;
      previewDialogVisible.value = true;
    }
  },
  edit: async (row?: Record<string, any>) => {
    if (!row?.tableId) return;
    await openEditConfig(row.tableId);
  },
  delete: async (row?: Record<string, any>) => {
    if (!row?.tableId) return;
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirm'), {
      type: 'warning',
    });
    const res = (await deleteGenTable(String(row.tableId))) as any;
    if (res?.code === 200) {
      ElMessage.success(t('common.success'));
      reloadTable();
    }
  },
  gen: async (row?: Record<string, any>) => {
    if (!row?.tableName) return;
    window.open(
      `${import.meta.env.VITE_APP_BASE_API || '/dev-api'}/tool/gen/download/${row.tableName}`,
      '_blank'
    );
  },
  refresh: () => reloadTable(),
};

const primaryRowActions = computed<RowActionRenderConfig[]>(() => [
  {
    key: 'preview',
    label: t('tool.gen.preview'),
    actionKey: 'preview',
    order: 10,
  },
  { key: 'edit', label: t('common.edit'), actionKey: 'edit', order: 20 },
  { key: 'gen', label: t('tool.gen.genCode'), actionKey: 'gen', order: 30 },
  {
    key: 'delete',
    label: t('common.delete'),
    actionKey: 'delete',
    order: 40,
    danger: true,
  },
]);

const rowActionColumn = computed<ColumnsItem>(() => ({
  key: '__ops__',
  dataKey: '__ops__',
  title: t('common.operation'),
  width: 240,
  align: 'right' as const,
  cellRenderer: ({ rowData }: any) =>
    h(ActionColumn, {
      row: rowData,
      actions: rowActions,
      primaryActions: primaryRowActions.value,
      extraActions: [],
      onRefresh: reloadTable,
    }),
}));

/******************************** 数据方法 ********************************/

async function fetchTableList(query: TableListQuery) {
  const res = (await listGenTable({
    pageNum: query.pageNum,
    pageSize: query.pageSize,
  })) as any;
  const rows = res?.rows ?? [];
  return { total: Number(res?.total ?? rows.length), rows };
}

function reloadTable() {
  currentPage.value = 1;
  void tableRef.value?.reload();
}

function formatTime(value: unknown) {
  if (!value) return '--';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('zh-CN');
}

/******************************** 导入表 ********************************/

const importDialogVisible = ref(false);
const dbSearchKeyword = ref('');
const dbSelectedKeys = ref<Array<number | string>>([]);
const dbCurrentPage = ref(1);

const dbColumns = computed<ColumnsItem[]>(() => [
  {
    key: 'tableName',
    dataKey: 'tableName',
    title: t('tool.gen.tableName'),
    width: 200,
  },
  {
    key: 'tableComment',
    dataKey: 'tableComment',
    title: t('tool.gen.tableComment'),
    width: 200,
  },
  {
    key: 'createTime',
    dataKey: 'createTime',
    title: t('tool.gen.createTime'),
    width: 160,
  },
]);

async function fetchDbTableList(query: TableListQuery) {
  const res = (await listDbTable({
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    tableName: dbSearchKeyword.value || undefined,
  })) as any;
  const rows = res?.rows ?? [];
  return { total: Number(res?.total ?? rows.length), rows };
}

function openImportDialog() {
  dbSelectedKeys.value = [];
  dbSearchKeyword.value = '';
  importDialogVisible.value = true;
}

function onDbSearch() {
  dbCurrentPage.value = 1;
  void dbTableRef.value?.reload();
}

async function doImport() {
  if (!dbSelectedKeys.value.length) {
    ElMessage.warning(t('tool.gen.selectTable'));
    return;
  }
  importing.value = true;
  try {
    await importTable(dbSelectedKeys.value.join(','));
    ElMessage.success(t('common.success'));
    importDialogVisible.value = false;
    reloadTable();
  } catch (e) {
    ElMessage.error(String(e));
  } finally {
    importing.value = false;
  }
}

/******************************** 编辑配置 ********************************/

const editDialogVisible = ref(false);
const editingTable = ref<Record<string, any> | null>(null);
const editingColumns = ref<Record<string, any>[]>([]);

async function openEditConfig(tableId: number | string) {
  const res = (await getGenTable(tableId)) as any;
  if (res?.code === 200 && res?.data) {
    editingTable.value = res.data.info ?? res.data;
    editingColumns.value = res.data.rows ?? [];
    editDialogVisible.value = true;
  }
}

async function doSaveConfig() {
  if (!editingTable.value) return;
  saving.value = true;
  try {
    await updateGenTable({
      ...editingTable.value,
      columns: editingColumns.value,
    });
    ElMessage.success(t('common.success'));
    editDialogVisible.value = false;
    reloadTable();
  } catch (e) {
    ElMessage.error(String(e));
  } finally {
    saving.value = false;
  }
}

/******************************** 预览 ********************************/

const previewDialogVisible = ref(false);
const previewTab = ref('');
const previewData = ref<Record<string, string>>({});
</script>

<style scoped lang="scss">
.gen-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--color-bg-page);
}

.gen-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.gen-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.gen-page__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.gen-page__header-actions {
  display: flex;
  gap: 12px;
}

.gen-page__table {
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  background: var(--color-bg-card);
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
}

.gen-page__import-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gen-page__edit-form {
  max-height: 60vh;
  overflow-y: auto;
}

.gen-page__preview-dialog {
  max-height: 65vh;
}

.gen-page__code {
  max-height: 50vh;
  overflow: auto;
  padding: 16px;
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 720px) {
  .gen-page {
    padding: 14px;
  }
}
</style>
