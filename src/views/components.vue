<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AsyncSelect } from '@/components/async-select';
import DialogList from '@/components/dialog-list/index.vue';
import type { AsyncSelectFetchParams } from '@/components/async-select';
import type { DialogListFetchParams } from '@/components/dialog-list/index.vue';
import TableEntlty from '@/components/table-entlty/index.vue';
import { getByEntityKeyAndFieldKeyApi } from '@/api/modules/user';
import type { ColumnsItem } from '@/components/table-entlty/index.type';
const { t } = useI18n();

// ── Mock 数据 ─────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  dept: string;
  email: string;
}

const MOCK_USERS: User[] = Array.from({ length: 80 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  dept: ['研发部', '产品部', '设计部', '运营部', '测试部'][i % 5],
  email: `user${i + 1}@example.com`,
}));

/** 模拟网络延迟 */
function sleep(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

/** AsyncSelect 的 fetcher：返回 { items, total } */
async function fetchUsers(params: AsyncSelectFetchParams) {
  await sleep();
  const filtered = MOCK_USERS.filter(
    (u) =>
      !params.keyword ||
      u.name.includes(params.keyword) ||
      u.dept.includes(params.keyword)
  );
  const start = (params.page - 1) * params.pageSize;
  return {
    items: filtered.slice(start, start + params.pageSize),
    total: filtered.length,
  };
}

/** DialogList 的 fetcher（同一份数据，接口一致） */
async function fetchUsersForDialog(params: DialogListFetchParams) {
  return fetchUsers(params);
}

// ── AsyncSelect 示例状态 ──────────────────────────────────────────────────

const singleUser = ref<number | null>(null);
const multiUsers = ref<number[]>([]);

// ── DialogList 示例状态 ───────────────────────────────────────────────────

const dialogVisible = ref(false);
const dialogMultiVisible = ref(false);

const singleDialogValue = ref<number | null>(null);
const multiDialogValue = ref<number[]>([]);

const singleConfirmed = ref<User[]>([]);
const multiConfirmed = ref<User[]>([]);

const columns = ref<ColumnsItem[]>([]);
const init = async () => {
  try {
    const list = await getByEntityKeyAndFieldKeyApi('user');
    const responseData = list?.data || [];

    if (Array.isArray(responseData)) {
      columns.value = responseData.map((t, ind) => ({
        title: t.fieldName,
        key: t.id,
        dataKey: t.fieldKey,
        width: 150,
        fixed: ind < 3 ? 'left' : '',
      }));
    }
    console.log(' columns.value ==>', columns.value);
  } catch (error) {
    console.error('Failed to load field config:', error);
  }
};
init();

const data = [
  {
    user_id: '1',
  },
  {
    user_id: '2',
  },
  {
    user_id: '3',
  },
  {
    user_id: '4',
  },
];
const page = ref(0);
for (let index = 0; index < 10; index++) {
  data.push({ user_id: String(index + 4) });
}

const pageChange = (num) => {
  console.log('num ==>', num);
  page.value = num;
};
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-title">{{ t('demo.title') }}</h2>

    <TableEntlty
      row-key="user_id"
      :columns="columns"
      :data="data"
      @page-change="pageChange"
      :current-page="page"
      :page-size="10"
      showPagination
      :total="200"
    />
    <!-- ════════════ AsyncSelect ════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">
        {{ t('demo.asyncSelect.title') }}
      </h3>

      <!-- 单选 -->
      <div class="demo-block">
        <p class="demo-block__label">{{ t('demo.asyncSelect.single') }}</p>
        <AsyncSelect
          v-model="singleUser"
          :fetcher="fetchUsers"
          value-key="id"
          label-key="name"
          :placeholder="t('demo.asyncSelect.selectUser')"
          :dialog-title="t('demo.asyncSelect.selectUser')"
          :columns="[
            { prop: 'name', label: t('demo.table.name'), width: 120 },
            { prop: 'dept', label: t('demo.table.dept'), minWidth: 120 },
            { prop: 'email', label: t('demo.table.email') },
          ]"
          style="width: 320px"
        />
        <span class="demo-block__value"
          >{{ t('demo.asyncSelect.currentValue') }}{{ singleUser ?? '—' }}</span
        >
      </div>

      <!-- 多选 -->
      <div class="demo-block">
        <p class="demo-block__label">{{ t('demo.asyncSelect.multi') }}</p>
        <AsyncSelect
          v-model="multiUsers"
          :multiple="true"
          :fetcher="fetchUsers"
          value-key="id"
          label-key="name"
          :placeholder="t('demo.asyncSelect.selectUserMulti')"
          :dialog-title="t('demo.asyncSelect.selectUser')"
          :dialog-page-size="10"
          :columns="[
            { prop: 'name', label: t('demo.table.name'), width: 120 },
            { prop: 'dept', label: t('demo.table.dept'), minWidth: 120 },
            { prop: 'email', label: t('demo.table.email') },
          ]"
          style="width: 420px"
        />
        <span class="demo-block__value">
          {{ t('demo.asyncSelect.selectedCount', { count: multiUsers.length })
          }}{{ multiUsers.join(', ') || '—' }}
        </span>
      </div>
    </section>

    <!-- ════════════ DialogList ════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">
        {{ t('demo.dialogList.title') }}
      </h3>

      <!-- 单选 -->
      <div class="demo-block">
        <p class="demo-block__label">{{ t('demo.dialogList.singleDialog') }}</p>
        <el-button type="primary" plain @click="dialogVisible = true">{{
          t('demo.dialogList.openSingleDialog')
        }}</el-button>
        <span v-if="singleConfirmed.length" class="demo-block__value">
          {{ t('demo.dialogList.selected') }}{{ singleConfirmed[0].name }}（{{
            singleConfirmed[0].dept
          }}）
        </span>

        <DialogList
          v-model:visible="dialogVisible"
          v-model="singleDialogValue"
          :multiple="false"
          :fetcher="fetchUsersForDialog"
          row-key="id"
          :dialog-title="t('demo.dialogList.selectUserSingle')"
          dialog-width="720px"
          :table-height="380"
          :page-size="15"
          :columns="[
            { key: 'name', title: t('demo.table.name'), width: 120 },
            { key: 'dept', title: t('demo.table.dept'), width: 120 },
            { key: 'email', title: t('demo.table.email'), flexGrow: 1 },
          ]"
          @confirm="(rows) => (singleConfirmed = rows as User[])"
        />
      </div>

      <!-- 多选 -->
      <div class="demo-block">
        <p class="demo-block__label">{{ t('demo.dialogList.multiDialog') }}</p>
        <el-button type="primary" plain @click="dialogMultiVisible = true">{{
          t('demo.dialogList.openMultiDialog')
        }}</el-button>
        <span v-if="multiConfirmed.length" class="demo-block__value">
          {{
            t('demo.dialogList.selectedCount', { count: multiConfirmed.length })
          }}
          {{ multiConfirmed.map((u) => u.name).join('、') }}
        </span>

        <DialogList
          v-model:visible="dialogMultiVisible"
          v-model="multiDialogValue"
          :multiple="true"
          :fetcher="fetchUsersForDialog"
          row-key="id"
          :dialog-title="t('demo.dialogList.selectUserMulti')"
          dialog-width="820px"
          :table-height="420"
          :page-size="15"
          :columns="[
            { key: 'name', title: t('demo.table.name'), width: 120 },
            { key: 'dept', title: t('demo.table.dept'), width: 120 },
            { key: 'email', title: t('demo.table.email'), flexGrow: 1 },
          ]"
          @confirm="(rows) => (multiConfirmed = rows as User[])"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 24px;
}

.demo-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 32px;
  color: var(--el-text-color-primary);
}

.demo-section {
  margin-bottom: 48px;
}

.demo-section__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 20px;
}

.demo-block {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.demo-block__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  width: 40px;
  flex-shrink: 0;
  margin: 0;
}

.demo-block__value {
  font-size: 13px;
  color: var(--el-color-primary);
}
</style>
