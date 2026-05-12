<template>
  <div class="online-page">
    <!-------------------------- 页面头部 -------------------------->
    <section class="online-page__header">
      <div>
        <h2 class="online-page__title">{{ t('monitor.online.title') }}</h2>
        <p class="online-page__subtitle">{{ t('monitor.online.desc') }}</p>
      </div>
      <el-button :loading="loading" @click="refreshData">
        {{ t('common.refresh') }}
      </el-button>
    </section>

    <!-------------------------- 列表区域 -------------------------->
    <section class="online-page__table">
      <TableEntity
        ref="tableRef"
        v-model:selected-keys="selectedKeys"
        v-model:current-page="currentPage"
        :data="fetchOnlineUsers"
        :columns="columns"
        :row-action-column="rowActionColumn"
        row-key="tokenId"
        :page-size="pageSize"
        :height="560"
        selectable
        multiple
        show-pagination
      />
    </section>
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
import { forceLogoutOnlineUser, listOnlineUsers } from '@/api/modules/monitor';

/******************************** 基础状态 ********************************/

const { t } = useI18n();
const loading = ref(false);
const tableRef = ref<InstanceType<typeof TableEntity>>();
const currentPage = ref(1);
const pageSize = 20;
const selectedKeys = ref<Array<number | string>>([]);
const tableRows = ref<Record<string, any>[]>([]);

/******************************** 表格列 ********************************/

const columns = computed<ColumnsItem[]>(() => [
  { key: 'tokenId', dataKey: 'tokenId', title: 'Token ID', width: 260 },
  {
    key: 'userName',
    dataKey: 'userName',
    title: t('monitor.online.userName'),
    width: 130,
  },
  {
    key: 'deptName',
    dataKey: 'deptName',
    title: t('monitor.online.deptName'),
    width: 130,
  },
  {
    key: 'ipaddr',
    dataKey: 'ipaddr',
    title: t('monitor.online.ip'),
    width: 150,
  },
  {
    key: 'loginLocation',
    dataKey: 'loginLocation',
    title: t('monitor.online.location'),
    width: 150,
  },
  {
    key: 'browser',
    dataKey: 'browser',
    title: t('monitor.online.browser'),
    width: 130,
  },
  { key: 'os', dataKey: 'os', title: t('monitor.online.os'), width: 150 },
  {
    key: 'loginTime',
    dataKey: 'loginTime',
    title: t('monitor.online.loginTime'),
    width: 180,
    cellRenderer: ({ cellData }: any) => h('span', formatTimestamp(cellData)),
  },
]);

/******************************** 行内操作 ********************************/

const rowActions = {
  forceLogout: async (row?: Record<string, any>) => {
    if (!row?.tokenId) return;
    await ElMessageBox.confirm(
      t('monitor.online.forceLogoutConfirm', { user: row.userName }),
      t('common.confirm'),
      { type: 'warning' }
    );
    try {
      await forceLogoutOnlineUser(row.tokenId as string);
      ElMessage.success(t('monitor.online.forceLogoutSuccess'));
      refreshData();
    } catch (e) {
      ElMessage.error(String(e));
    }
  },
  refresh: () => refreshData(),
};

const primaryRowActions = computed<RowActionRenderConfig[]>(() => [
  {
    key: 'forceLogout',
    label: t('monitor.online.forceLogout'),
    actionKey: 'forceLogout',
    order: 10,
    danger: true,
  },
]);

const rowActionColumn = computed<ColumnsItem>(() => ({
  key: '__ops__',
  dataKey: '__ops__',
  title: t('common.operation'),
  width: 130,
  align: 'right' as const,
  cellRenderer: ({ rowData }: any) =>
    h(ActionColumn, {
      row: rowData,
      actions: rowActions,
      primaryActions: primaryRowActions.value,
      extraActions: [],
      onRefresh: refreshData,
    }),
}));

/******************************** 工具方法 ********************************/

function formatTimestamp(value: unknown) {
  if (!value) return '--';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '--';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/******************************** 数据方法 ********************************/

async function fetchOnlineUsers(query: TableListQuery) {
  loading.value = true;
  try {
    const response = (await listOnlineUsers({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    })) as any;
    const rows = response?.rows ?? [];
    tableRows.value = rows;
    return { total: Number(response?.total ?? rows.length), rows };
  } catch (e) {
    console.error('Failed to fetch online users:', e);
    return { total: 0, rows: [] };
  } finally {
    loading.value = false;
  }
}

function refreshData() {
  currentPage.value = 1;
  void tableRef.value?.reload();
}
</script>

<style scoped lang="scss">
.online-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--color-bg-page);
}

.online-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.online-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.online-page__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.online-page__table {
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  background: var(--color-bg-card);
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
}

@media (max-width: 720px) {
  .online-page {
    padding: 14px;
  }
}
</style>
