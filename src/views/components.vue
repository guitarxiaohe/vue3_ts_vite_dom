<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AsyncSelect } from '@/components/async-select';
import DialogList from '@/components/dialog-list/index.vue';
import type { AsyncSelectFetchParams } from '@/components/async-select';
import type { DialogListFetchParams } from '@/components/dialog-list/index.vue';
import TableEntlty from '@/components/table-entity/index.vue';
import type {
  ColumnsItem,
  TableListQuery,
} from '@/components/table-entity/index.type';
import { httpClient } from '@/api/client';
import UserAvatarInfo from '@/components/user-avatar-info/index.vue';
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
  console.log('variable ==>', {
    items: filtered.slice(start, start + params.pageSize),
    total: filtered.length,
  });
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

const page = ref(1);

/** TableEntity 异步 data：若依分页 { total, rows } */
async function fetchSystemUserList(query: TableListQuery) {
  const res = (await httpClient.get('/system/user/list', {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
  })) as unknown as { total?: number; rows?: Record<string, unknown>[] };
  return {
    total: Number(res.total ?? 0),
    rows: (res.rows ?? []) as Record<string, any>[],
  };
}
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-title">{{ t('demo.title') }}</h2>

    <!-- ════════════ UserAvatarInfo ════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">{{ t('demo.userAvatar.title') }}</h3>
      <div class="demo-block demo-block--row">
        <div class="demo-block__label">{{ t('demo.userAvatar.male') }}</div>
        <UserAvatarInfo user-id="1" :size="44" />
      </div>
      <div class="demo-block demo-block--row">
        <div class="demo-block__label">{{ t('demo.userAvatar.female') }}</div>
        <UserAvatarInfo user-id="2" :size="44" />
      </div>
      <div class="demo-block demo-block--row">
        <div class="demo-block__label">{{ t('demo.userAvatar.unknown') }}</div>
        <UserAvatarInfo :user-id="1" :size="44" />
      </div>
      <div class="demo-block demo-block--row">
        <div class="demo-block__label">
          {{ t('demo.userAvatar.userIdRemote') }}
        </div>
        <UserAvatarInfo :user-id="1" :size="44" />
      </div>
      <div class="demo-block demo-block--row">
        <div class="demo-block__label">
          {{ t('demo.userAvatar.drawerDemo') }}
        </div>
        <UserAvatarInfo
          name="周七"
          subtitle="研发部 / 前端组"
          gender="male"
          :age="28"
          :work-years="5"
          email="zhouqi@example.com"
          phone="13900001111"
          department="研发部 · 前端组"
          job-level="P6"
          :size="44"
        />
      </div>
      <div class="demo-block demo-block--row">
        <div class="demo-block__label">
          {{ t('demo.userAvatar.drawerSlotDemo') }}
        </div>
        <UserAvatarInfo
          name="赵八"
          subtitle="运营部"
          gender="female"
          :size="44"
        >
          <el-alert
            type="success"
            :title="t('common.success')"
            :closable="false"
          />
        </UserAvatarInfo>
      </div>
    </section>

    <TableEntlty
      :data="fetchSystemUserList"
      entity-key="user"
      row-key="userId"
      :columns="columns"
      v-model:current-page="page"
      :page-size="10"
      showPagination
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
            { title: 'name', label: t('demo.table.name'), width: 120 },
            { title: 'dept', label: t('demo.table.dept'), width: 120 },
            { title: 'email', label: t('demo.table.email'), width: 120 },
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
          value-key="deptId"
          label-key="deptName"
          :entityConfig="{
            entityKey: 'dept',
          }"
          :placeholder="t('demo.asyncSelect.selectUserMulti')"
          :dialog-title="t('demo.asyncSelect.selectUser')"
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
            { key: 'email', title: t('demo.table.email'), width: 1 },
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
          :entityConfig="{
            entityKey: 'dept',
          }"
          :fetcher="fetchUsersForDialog"
          row-key="id"
          :dialog-title="t('demo.dialogList.selectUserMulti')"
          dialog-width="820px"
          :table-height="420"
          :page-size="15"
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

.demo-block--row .demo-block__label {
  width: auto;
  min-width: 200px;
}

.demo-block__value {
  font-size: 13px;
  color: var(--el-color-primary);
}
</style>
