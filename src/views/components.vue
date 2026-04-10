<script setup lang="ts">
import { ref } from 'vue'
import { AsyncSelect } from '@/components/async-select'
import DialogList from '@/components/dialog-list/index.vue'
import type { AsyncSelectFetchParams } from '@/components/async-select'
import type { DialogListFetchParams } from '@/components/dialog-list/index.vue'

// ── Mock 数据 ─────────────────────────────────────────────────────────────

interface User {
  id: number
  name: string
  dept: string
  email: string
}

const MOCK_USERS: User[] = Array.from({ length: 80 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  dept: ['研发部', '产品部', '设计部', '运营部', '测试部'][i % 5],
  email: `user${i + 1}@example.com`,
}))

/** 模拟网络延迟 */
function sleep(ms = 300) {
  return new Promise((r) => setTimeout(r, ms))
}

/** AsyncSelect 的 fetcher：返回 { items, total } */
async function fetchUsers(params: AsyncSelectFetchParams) {
  await sleep()
  const filtered = MOCK_USERS.filter(
    (u) => !params.keyword || u.name.includes(params.keyword) || u.dept.includes(params.keyword),
  )
  const start = (params.page - 1) * params.pageSize
  return {
    items: filtered.slice(start, start + params.pageSize),
    total: filtered.length,
  }
}

/** DialogList 的 fetcher（同一份数据，接口一致） */
async function fetchUsersForDialog(params: DialogListFetchParams) {
  return fetchUsers(params)
}

// ── AsyncSelect 示例状态 ──────────────────────────────────────────────────

const singleUser = ref<number | null>(null)
const multiUsers = ref<number[]>([])

// ── DialogList 示例状态 ───────────────────────────────────────────────────

const dialogVisible = ref(false)
const dialogMultiVisible = ref(false)

const singleDialogValue = ref<number | null>(null)
const multiDialogValue = ref<number[]>([])

const singleConfirmed = ref<User[]>([])
const multiConfirmed = ref<User[]>([])
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-title">组件示例</h2>

    <!-- ════════════ AsyncSelect ════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">AsyncSelect — 异步下拉（懒加载 + 弹窗选择）</h3>

      <!-- 单选 -->
      <div class="demo-block">
        <p class="demo-block__label">单选</p>
        <AsyncSelect
          v-model="singleUser"
          :fetcher="fetchUsers"
          value-key="id"
          label-key="name"
          placeholder="请选择用户"
          dialog-title="选择用户"
          :columns="[
            { prop: 'name', label: '姓名', width: 120 },
            { prop: 'dept', label: '部门', minWidth: 120 },
            { prop: 'email', label: '邮箱' },
          ]"
          style="width: 320px"
        />
        <span class="demo-block__value">当前值：{{ singleUser ?? '—' }}</span>
      </div>

      <!-- 多选 -->
      <div class="demo-block">
        <p class="demo-block__label">多选</p>
        <AsyncSelect
          v-model="multiUsers"
          :multiple="true"
          :fetcher="fetchUsers"
          value-key="id"
          label-key="name"
          placeholder="请选择用户（可多选）"
          dialog-title="选择用户"
          :dialog-page-size="10"
          :columns="[
            { prop: 'name', label: '姓名', width: 120 },
            { prop: 'dept', label: '部门', minWidth: 120 },
            { prop: 'email', label: '邮箱' },
          ]"
          style="width: 420px"
        />
        <span class="demo-block__value">
          已选 {{ multiUsers.length }} 项：{{ multiUsers.join(', ') || '—' }}
        </span>
      </div>
    </section>

    <!-- ════════════ DialogList ════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">DialogList — 弹窗列表（el-table-v2 + 序号/复选框）</h3>

      <!-- 单选 -->
      <div class="demo-block">
        <p class="demo-block__label">单选弹窗</p>
        <el-button type="primary" plain @click="dialogVisible = true">打开单选弹窗</el-button>
        <span v-if="singleConfirmed.length" class="demo-block__value">
          已选：{{ singleConfirmed[0].name }}（{{ singleConfirmed[0].dept }}）
        </span>

        <DialogList
          v-model:visible="dialogVisible"
          v-model="singleDialogValue"
          :multiple="false"
          :fetcher="fetchUsersForDialog"
          row-key="id"
          dialog-title="选择用户（单选）"
          dialog-width="720px"
          :table-height="380"
          :page-size="15"
          :columns="[
            { key: 'name',  title: '姓名',  width: 120 },
            { key: 'dept',  title: '部门',  width: 120 },
            { key: 'email', title: '邮箱',  flexGrow: 1 },
          ]"
          @confirm="(rows) => (singleConfirmed = rows as User[])"
        />
      </div>

      <!-- 多选 -->
      <div class="demo-block">
        <p class="demo-block__label">多选弹窗</p>
        <el-button type="primary" plain @click="dialogMultiVisible = true">打开多选弹窗</el-button>
        <span v-if="multiConfirmed.length" class="demo-block__value">
          已选 {{ multiConfirmed.length }} 项：
          {{ multiConfirmed.map((u) => u.name).join('、') }}
        </span>

        <DialogList
          v-model:visible="dialogMultiVisible"
          v-model="multiDialogValue"
          :multiple="true"
          :fetcher="fetchUsersForDialog"
          row-key="id"
          dialog-title="选择用户（多选）"
          dialog-width="820px"
          :table-height="420"
          :page-size="15"
          :columns="[
            { key: 'name',  title: '姓名',  width: 120 },
            { key: 'dept',  title: '部门',  width: 120 },
            { key: 'email', title: '邮箱',  flexGrow: 1 },
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
