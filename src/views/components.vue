<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { httpClient } from '@/api/client';

// ── 组件导入 ────────────────────────────────────────────────────────────────
import { AsyncSelect } from '@/components/async-select';
import AsyncCascader from '@/components/async-cascader/async-cascader.vue';
import DialogList from '@/components/dialog-list/index.vue';
import DictTag from '@/components/dict-tag/index.vue';
import FileUpload from '@/components/file-upload/file-upload.vue';
import PictureUpload from '@/components/picture-upload/picture-upload.vue';
import ImportDialog from '@/components/import-dialog/index.vue';
import NoticeBar from '@/components/notice-bar/index.vue';
import NotifyBell from '@/components/notify-bell/index.vue';
import SettingsPanel from '@/components/settings-panel/index.vue';
import SocketMsg from '@/components/socket-msg/index.vue';

import TableEntlty from '@/components/table-entity/index.vue';
import UserAvatarInfo from '@/components/user-avatar-info/index.vue';

// ── 类型导入 ────────────────────────────────────────────────────────────────
import type { AsyncSelectFetchParams } from '@/components/async-select';
import type {
  AsyncCascaderFetchParams,
  AsyncCascaderNode,
  CascaderVal,
} from '@/components/async-cascader/async-cascader.type';
import type { DialogListFetchParams } from '@/components/dialog-list/index.vue';
import type { AttachmentData } from '@/components/file-upload/file-upload.type';
import type {
  ImportDialogModeOption,
  ImportDialogParsePayload,
  ImportDialogParseResult,
  ImportDialogSubmitPayload,
  ImportDialogSubmitResult,
  ImportDialogTargetField,
} from '@/components/import-dialog/index.type';

import type {
  ColumnsItem,
  TableListQuery,
} from '@/components/table-entity/index.type';
import type { WsMessage } from '@/types/ws';

// ══════════════════════════════════════════════════════════════════════════════
// Mock 数据 & 工具
// ══════════════════════════════════════════════════════════════════════════════

/** 演示用图片地址 */
const DEMO_IMAGE =
  '/profile/upload/2026/05/28/d2d3d441-fceb-4346-97e8-9904950b5f7c.jpeg';

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

function sleep(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── 通用 fetcher ─────────────────────────────────────────────────────────────

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

async function fetchUsersForDialog(params: DialogListFetchParams) {
  return fetchUsers(params);
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. AsyncSelect 示例状态
// ══════════════════════════════════════════════════════════════════════════════

const singleUser = ref<number | null>(null);
const multiUsers = ref<number[]>([]);

// ══════════════════════════════════════════════════════════════════════════════
// 2. AsyncCascader 示例状态
// ══════════════════════════════════════════════════════════════════════════════

const cascaderVal = ref<CascaderVal>([]);

const MOCK_TREE: AsyncCascaderNode[] = [
  {
    label: '总部',
    value: '1',
    children: [
      {
        label: '研发中心',
        value: '1-1',
        children: [
          { label: '前端组', value: '1-1-1', leaf: true },
          { label: '后端组', value: '1-1-2', leaf: true },
          { label: '测试组', value: '1-1-3', leaf: true },
        ],
      },
      {
        label: '产品中心',
        value: '1-2',
        children: [
          { label: '产品一组', value: '1-2-1', leaf: true },
          { label: '产品二组', value: '1-2-2', leaf: true },
        ],
      },
    ],
  },
  {
    label: '分公司 A',
    value: '2',
    children: [
      { label: '技术部', value: '2-1', leaf: true },
      { label: '市场部', value: '2-2', leaf: true },
    ],
  },
];

async function fetchCascaderNodes(
  params: AsyncCascaderFetchParams
): Promise<AsyncCascaderNode[]> {
  await sleep(150);
  if (params.parentValue == null) {
    return MOCK_TREE.map(({ children, ...rest }) => ({
      ...rest,
      children: children?.length ? [] : undefined,
    }));
  }
  const path = String(params.parentValue);
  // 简单查找：遍历树找到对应子节点
  function findChildren(
    nodes: AsyncCascaderNode[],
    val: string
  ): AsyncCascaderNode[] | null {
    for (const n of nodes) {
      if (String(n.value) === val) return n.children ?? null;
      if (n.children) {
        const r = findChildren(n.children, val);
        if (r) return r;
      }
    }
    return null;
  }
  return findChildren(MOCK_TREE, path) ?? [];
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. DialogList 示例状态
// ══════════════════════════════════════════════════════════════════════════════

const dialogVisible = ref(false);
const dialogMultiVisible = ref(false);
const singleDialogValue = ref<number | null>(null);
const multiDialogValue = ref<number[]>([]);
const singleConfirmed = ref<User[]>([]);
const multiConfirmed = ref<User[]>([]);

// ══════════════════════════════════════════════════════════════════════════════
// 4. FileUpload 示例状态
// ══════════════════════════════════════════════════════════════════════════════

const fileSuccess = ref<AttachmentData | string>(DEMO_IMAGE);
const fileError = ref<AttachmentData | string>('');
const fileLoading = ref<AttachmentData | string>('');
const fileDisabled = ref<AttachmentData | string>(DEMO_IMAGE);
const multiFiles = ref<AttachmentData[]>([]);

/** 各文件类型图标演示 */
const FILE_TYPE_SAMPLES: AttachmentData[] = [
  { name: '年度报告.pdf', fileSuffix: '.pdf', url: '#', size: 2048576 },
  { name: '需求文档.docx', fileSuffix: '.docx', url: '#', size: 512000 },
  { name: '数据报表.xlsx', fileSuffix: '.xlsx', url: '#', size: 128000 },
  { name: '演示文稿.pptx', fileSuffix: '.pptx', url: '#', size: 3072000 },
  { name: '封面图.jpg', fileSuffix: '.jpg', url: '#', size: 256000 },
  { name: '录屏.mp4', fileSuffix: '.mp4', url: '#', size: 51200000 },
  { name: '录音.mp3', fileSuffix: '.mp3', url: '#', size: 4096000 },
  { name: '备份.zip', fileSuffix: '.zip', url: '#', size: 10240000 },
  { name: '说明.txt', fileSuffix: '.txt', url: '#', size: 2048 },
  { name: 'utils.ts', fileSuffix: '.ts', url: '#', size: 4096 },
  { name: '未知文件.xyz', fileSuffix: '.xyz', url: '#', size: 1024 },
];

// ══════════════════════════════════════════════════════════════════════════════
// 6. PictureUpload 示例状态
// ══════════════════════════════════════════════════════════════════════════════

const avatarPic = ref<AttachmentData | string>(DEMO_IMAGE);
const emptyPic = ref<AttachmentData | string>('');

// ══════════════════════════════════════════════════════════════════════════════
// 7. ImportDialog 示例状态
// ══════════════════════════════════════════════════════════════════════════════

const importVisible = ref(false);

const importModes: ImportDialogModeOption[] = [
  { label: '新增导入', value: 'create' },
  { label: '更新导入', value: 'update' },
];

const importTargetFields: ImportDialogTargetField[] = [
  {
    field: 'userName',
    label: '用户名称',
    required: true,
    allowDuplicateCheck: true,
  },
  { field: 'nickName', label: '用户昵称', required: true },
  { field: 'email', label: '邮箱' },
  { field: 'phonenumber', label: '手机号码' },
  { field: 'sex', label: '性别' },
  { field: 'status', label: '状态' },
  { field: 'deptName', label: '部门' },
];

async function mockParseFile(
  _payload: ImportDialogParsePayload
): Promise<ImportDialogParseResult> {
  await sleep(500);
  return {
    fileName: '用户导入模板.xlsx',
    total: 3,
    sheets: [
      { label: 'Sheet1', value: 'Sheet1' },
      { label: 'Sheet2', value: 'Sheet2' },
    ],
    currentSheet: 'Sheet1',
    previewColumns: [
      { prop: 'userName', label: '用户名称', width: 120 },
      { prop: 'nickName', label: '用户昵称', width: 120 },
      { prop: 'email', label: '邮箱', width: 180 },
      { prop: 'phonenumber', label: '手机号码', width: 140 },
      { prop: 'sex', label: '性别', width: 80 },
      { prop: 'status', label: '状态', width: 80 },
      { prop: 'deptName', label: '部门', width: 120 },
    ],
    previewRows: [
      {
        userName: '张三',
        nickName: '小张',
        email: 'zhangsan@example.com',
        phonenumber: '13800001111',
        sex: '男',
        status: '正常',
        deptName: '研发部',
      },
      {
        userName: '李四',
        nickName: '小李',
        email: 'lisi@example.com',
        phonenumber: '13800002222',
        sex: '女',
        status: '正常',
        deptName: '产品部',
      },
      {
        userName: '王五',
        nickName: '小王',
        email: 'wangwu@example.com',
        phonenumber: '13800003333',
        sex: '男',
        status: '停用',
        deptName: '设计部',
      },
    ],
  };
}

async function mockSubmitImport(
  _payload: ImportDialogSubmitPayload
): Promise<ImportDialogSubmitResult> {
  await sleep(1000);
  return {
    success: true,
    title: '导入完成',
    description: '成功导入 3 条，失败 0 条',
    successCount: 3,
    failureCount: 0,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. SocketMsg 示例数据
// ══════════════════════════════════════════════════════════════════════════════

const mockWsMessage: WsMessage = {
  type: 'system',
  title: '系统通知',
  text: '您有一条新的审批待办，请及时处理。',
  path: '/components',
  params: {},
};

// ══════════════════════════════════════════════════════════════════════════════
// 10. TableEntity 示例状态
// ══════════════════════════════════════════════════════════════════════════════

const columns = ref<ColumnsItem[]>([]);
const page = ref(1);

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

// ══════════════════════════════════════════════════════════════════════════════
// 11. PictureUpload 事件处理
// ══════════════════════════════════════════════════════════════════════════════

function onPicSuccess(file: AttachmentData) {
  ElMessage.success(`图片上传成功: ${file.name ?? file.url}`);
}
function onPicRemove(file: AttachmentData) {
  ElMessage.info(`移除图片: ${file.name ?? file.url}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// 工具
// ══════════════════════════════════════════════════════════════════════════════
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-title">组件库示例</h2>

    <!-- ═══════════════════════════════════════════════════════════════════════
      DictTag — 字典标签着色
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">DictTag 字典标签</h3>
      <div class="demo-block">
        <p class="demo-block__label">用户性别</p>
        <DictTag value="0" label="男" color="#409eff" />
        <DictTag value="1" label="女" color="#e040fb" />
        <DictTag value="2" label="未知" color="#909399" />
      </div>
      <div class="demo-block">
        <p class="demo-block__label">启用状态</p>
        <DictTag value="0" label="正常" color="#67c23a" />
        <DictTag value="1" label="停用" color="#f56c6c" />
      </div>
      <div class="demo-block">
        <p class="demo-block__label">显隐状态</p>
        <DictTag value="0" label="显示" color="#67c23a" />
        <DictTag value="1" label="隐藏" color="#e6a23c" />
      </div>
      <p class="demo-section__note">
        数据来自全局字典缓存 (useAllDictDataQuery)，此处为无后端时的静态模拟
      </p>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
      PictureUpload — 图片上传
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">PictureUpload 图片上传</h3>

      <div class="demo-block demo-block--col">
        <p class="demo-block__label">已有图片（预览 / 下载 / 删除）</p>
        <div class="demo-block__row">
          <PictureUpload
            v-model="avatarPic"
            :width="128"
            :height="128"
            @upload-success="onPicSuccess"
            @remove="onPicRemove"
          />
          <span class="demo-block__value">
            modelValue:
            {{
              typeof avatarPic === 'string'
                ? avatarPic
                : (avatarPic as AttachmentData)?.url
            }}
          </span>
        </div>
      </div>

      <div class="demo-block demo-block--col">
        <p class="demo-block__label">空状态（点击上传）</p>
        <PictureUpload v-model="emptyPic" :width="128" :height="128" />
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
      FileUpload — 文件上传
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">FileUpload 文件上传</h3>

      <!-- 成功状态 -->
      <div class="demo-block demo-block--col">
        <p class="demo-block__label">
          <el-tag type="success" size="small" effect="dark">成功</el-tag>
          单文件已上传
        </p>
        <FileUpload v-model="fileSuccess" :max-size="2000" />
        <span class="demo-block__value">
          modelValue:
          {{
            typeof fileSuccess === 'string'
              ? fileSuccess
              : (fileSuccess as AttachmentData)?.name
          }}
        </span>
      </div>

      <!-- 失败状态 -->
      <div class="demo-block demo-block--col">
        <p class="demo-block__label">
          <el-tag type="danger" size="small" effect="dark">失败</el-tag>
          上传错误
        </p>
        <FileUpload
          v-model="fileError"
          error-message="文件格式不支持，仅允许 .pdf .doc .xlsx"
          :max-size="10"
        />
      </div>

      <!-- 加载中状态 -->
      <div class="demo-block demo-block--col">
        <p class="demo-block__label">
          <el-tag type="warning" size="small" effect="dark">加载中</el-tag>
          上传进度
        </p>
        <div
          style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap"
        >
          <FileUpload v-model="fileLoading" :disabled="true" :max-size="10" />
          <el-progress :percentage="65" :stroke-width="6" style="width: 100%" />
          <div class="demo-loading-indicator">
            <span class="demo-section__note" style="margin: 0">
              实际上传时自动显示进度条，此处为静态模拟。组件内部通过 FileStatus
              子组件自动切换 loading / success / error 三态。
            </span>
          </div>
        </div>
      </div>

      <!-- 禁用状态 -->
      <div class="demo-block demo-block--col">
        <p class="demo-block__label">
          <el-tag type="info" size="small" effect="dark">禁用</el-tag>
          不可操作
        </p>
        <FileUpload v-model="fileDisabled" :disabled="true" :max-size="10" />
      </div>

      <!-- 多文件 -->
      <div class="demo-block demo-block--col">
        <p class="demo-block__label">
          <el-tag size="small" effect="dark">批量</el-tag>
          多文件上传
        </p>
        <FileUpload v-model="multiFiles" :max-count="5" :max-size="2000" />
        <span class="demo-block__value" v-if="multiFiles.length">
          已选 {{ multiFiles.length }} 个文件
        </span>
      </div>

      <!-- 文件类型图标一览 -->
      <div class="demo-block demo-block--col">
        <p class="demo-block__label">
          <el-tag size="small" effect="dark">图标</el-tag>
          支持的 11 种文件类型
        </p>
        <div class="demo-icon-grid">
          <div
            v-for="sample in FILE_TYPE_SAMPLES"
            :key="sample.name"
            class="demo-icon-card"
          >
            <FileUpload
              :model-value="sample"
              :show-preview="false"
              :show-download="false"
              :show-remove="false"
              :disabled="true"
              :width="160"
            />
            <span class="demo-icon-card__label">{{ sample.fileSuffix }}</span>
          </div>
        </div>
        <p class="demo-section__note">
          根据文件名后缀自动匹配图标和颜色：PDF / Word / Excel / PowerPoint /
          图片 / 视频 / 音频 / 压缩包 / 文本 / 代码 / 未知类型。颜色和图标均来自
          use-file-type.ts 的 FILE_TYPE_CONFIG 配置。
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
      UserAvatarInfo — 用户头像信息
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">UserAvatarInfo 用户头像</h3>

      <div class="demo-block demo-block--row">
        <p class="demo-block__label">头像 + 详情抽屉（静态数据）</p>
        <UserAvatarInfo
          name="白敬亭"
          subtitle="研发部 / 前端组"
          gender="male"
          :age="28"
          :work-years="5"
          email="zhangsan@example.com"
          phone="13900001111"
          department="运维部门"
          job-level="P6"
          :size="25"
          src="/profile/upload/2026/05/20/4cf521d5-1760-4174-af2c-a9bccfabfc37.jpeg"
          user-id="104"
        />
      </div>

      <div class="demo-block demo-block--row">
        <p class="demo-block__label">仅头像 + 名称（无抽屉）</p>
        <UserAvatarInfo
          name="李四"
          subtitle="产品部"
          gender="female"
          :enable-drawer="false"
          :size="30"
          :src="DEMO_IMAGE"
        />
      </div>

      <div class="demo-block demo-block--row">
        <p class="demo-block__label">自定义抽屉内容（slot）</p>
        <UserAvatarInfo
          name="王五"
          subtitle="运营部"
          gender="male"
          :size="35"
          :src="DEMO_IMAGE"
        >
          <el-alert
            type="success"
            title="额外信息区域"
            :closable="false"
            style="margin-top: 12px"
          />
        </UserAvatarInfo>
      </div>

      <p class="demo-section__note">
        点击头像可打开详情抽屉，抽屉内包含完整的用户信息卡片
      </p>
    </section>
    <!-- ═══════════════════════════════════════════════════════════════════════
      AsyncCascader — 异步级联选择器
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">AsyncCascader 异步级联选择器</h3>
      <div class="demo-block">
        <p class="demo-block__label">组织架构</p>
        <AsyncCascader
          v-model="cascaderVal"
          :fetcher="fetchCascaderNodes"
          placeholder="请选择部门"
          style="width: 320px"
        />
        <span class="demo-block__value">
          选中路径: {{ cascaderVal.join(' / ') || '—' }}
        </span>
      </div>
      <p class="demo-section__note">
        懒加载模式：每次展开节点时调用 fetcher
        获取子节点，支持大数据量组织树场景
      </p>
    </section>
    <!-- ═══════════════════════════════════════════════════════════════════════
      AsyncSelect — 异步下拉选择
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">AsyncSelect 异步下拉选择器</h3>

      <div class="demo-block">
        <p class="demo-block__label">单选</p>
        <AsyncSelect
          v-model="singleUser"
          :fetcher="fetchUsers"
          value-key="userId"
          label-key="name"
          placeholder="请选择用户"
          :dialog-title="'选择用户'"
          :entity-config="{
            entityKey: 'user',
          }"
        />
        <span class="demo-block__value">当前值: {{ singleUser ?? '—' }}</span>
      </div>

      <div class="demo-block">
        <p class="demo-block__label">多选</p>
        <AsyncSelect
          v-model="multiUsers"
          :multiple="true"
          value-key="userId"
          :entity-config="{
            entityKey: 'user',
          }"
          label-key="name"
          placeholder="请选择多个用户"
        />
        <span class="demo-block__value">
          已选 {{ multiUsers.length }} 项: {{ multiUsers.join(', ') || '—' }}
        </span>
      </div>
    </section>
    <!-- ═══════════════════════════════════════════════════════════════════════
      TableEntity — 虚拟化表格
      ════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">TableEntity 虚拟化数据表格</h3>

      <!-- 功能说明卡片 -->
      <div class="demo-feature-grid">
        <div class="demo-feature-card">
          <span class="demo-feature-card__icon">📊</span>
          <strong>虚拟化渲染</strong>
          <p>基于 ElTableV2，万级数据流畅滚动，仅渲染可视区域</p>
        </div>
        <div class="demo-feature-card">
          <span class="demo-feature-card__icon">🔧</span>
          <strong>列设置工具栏</strong>
          <p>拖拽排序列、一键显隐列，通过工具栏弹窗操作</p>
        </div>
        <div class="demo-feature-card">
          <span class="demo-feature-card__icon">📋</span>
          <strong>行详情抽屉</strong>
          <p>点击行展开详情面板，支持字段网格布局与子表嵌入</p>
        </div>
        <div class="demo-feature-card">
          <span class="demo-feature-card__icon">✅</span>
          <strong>多选 / 排序 / 分页</strong>
          <p>行复选框、表头升降序、底部分页栏均可按需启闭</p>
        </div>
        <div class="demo-feature-card">
          <span class="demo-feature-card__icon">📥</span>
          <strong>数据源灵活</strong>
          <p>支持静态数组、异步 fetcher 函数、entityKey 自动拉取三种模式</p>
        </div>
        <div class="demo-feature-card">
          <span class="demo-feature-card__icon">🎨</span>
          <strong>自定义渲染</strong>
          <p>内置头像单元格、图片单元格、文件附件单元格等专用渲染器</p>
        </div>
      </div>

      <!-- 操作提示 -->
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
        show-icon
      >
        <template #title>
          <span style="font-weight: 600">操作指引</span>
        </template>
        <ul class="demo-guide-list">
          <li><b>点击列头右侧图标</b> → 打开列设置弹窗，拖拽排序或勾选显隐</li>
          <li><b>点击行</b> → 打开详情抽屉，展示该行所有字段及关联子表数据</li>
          <li><b>勾选行复选框</b> → 可用于批量删除、导出等批量操作</li>
          <li><b>拖拽列边框</b> → 调整列宽，列宽变更即时生效</li>
          <li><b>表头排序图标</b> → 点击排序列，切换升序 / 降序</li>
          <li><b>底部分页栏</b> → 切换页码、调整每页条数</li>
        </ul>
      </el-alert>

      <!-- 示例一：静态数据表格 -->
      <h4 class="demo-sub-title">示例一：静态数组数据</h4>
      <TableEntlty
        :data="MOCK_USERS"
        :columns="[
          { dataKey: 'id', title: 'ID', width: 80 },
          { dataKey: 'name', title: '姓名', width: 140, sortable: true },
          { dataKey: 'dept', title: '部门', width: 120, sortable: true },
          { dataKey: 'email', title: '邮箱', width: 1 },
        ]"
        row-key="id"
        :page-size="20"
        :height="320"
        :row-height="40"
      />
      <p class="demo-section__note">
        传入静态数组 data，无需后端 API，column 指定 width: 1
        的列会自动填充剩余宽度
      </p>

      <!-- 示例二：异步 fetcher 数据表格 -->
      <h4 class="demo-sub-title">示例二：异步 entity-key + 分页</h4>
      <TableEntlty
        :data="fetchSystemUserList"
        entity-key="user"
        :columns="columns"
        row-key="userId"
        :current-page="page"
        :page-size="10"
        :height="420"
        :row-height="40"
        show-pagination
        @page-change="(p) => (page = p)"
      />
      <p class="demo-section__note">
        传入异步 fetcher 函数，返回 { total, rows }，配合 showPagination
        实现服务端分页。 注意：多个 TableEntlty 共享页面时 entityKey
        需相同，否则列自动拉取可能冲突
      </p>
    </section>
    <!-- ═══════════════════════════════════════════════════════════════════════
      DialogList — 弹窗列表选择
    ══════════════════════════════════════════════════════════════════════════ -->
    <section v-if="false" class="demo-section">
      <h3 class="demo-section__title">DialogList 弹窗选择器</h3>

      <div class="demo-block">
        <p class="demo-block__label">单选弹窗</p>
        <el-button type="primary" plain @click="dialogVisible = true">
          打开单选弹窗
        </el-button>
        <span v-if="singleConfirmed.length" class="demo-block__value">
          已选: {{ singleConfirmed[0].name }} ({{ singleConfirmed[0].dept }})
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
          entity-key="user"
          @confirm="(rows) => (singleConfirmed = rows as User[])"
        />
      </div>

      <div class="demo-block">
        <p class="demo-block__label">多选弹窗</p>
        <el-button type="primary" plain @click="dialogMultiVisible = true">
          打开多选弹窗
        </el-button>
        <span v-if="multiConfirmed.length" class="demo-block__value">
          已选 {{ multiConfirmed.length }} 人:
          {{ multiConfirmed.map((u) => u.name).join('、') }}
        </span>
        <DialogList
          v-model:visible="dialogMultiVisible"
          v-model="multiDialogValue"
          :fetcher="fetchUsersForDialog"
          row-key="id"
          dialog-title="选择用户（多选）"
          dialog-width="820px"
          :table-height="420"
          :page-size="15"
          :columns="[
            { key: 'name', title: '姓名', width: 120 },
            { key: 'dept', title: '部门', width: 120 },
            { key: 'email', title: '邮箱', width: 1 },
          ]"
          @confirm="(rows) => (multiConfirmed = rows as User[])"
        />
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
      ImportDialog — Excel 导入弹窗
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">ImportDialog Excel 导入</h3>
      <div class="demo-block">
        <p class="demo-block__label">用户导入</p>
        <el-button type="success" plain @click="importVisible = true">
          打开导入弹窗
        </el-button>
        <span class="demo-section__note" style="margin: 0">
          支持新增 / 更新两种模式，含文件解析 → 字段映射 → 提交的完整流程
        </span>
        <ImportDialog
          v-model="importVisible"
          title="用户数据导入"
          :modes="importModes"
          :target-fields="importTargetFields"
          :parse-file="mockParseFile"
          :submit-import="mockSubmitImport"
          @success="(r) => ElMessage.success(`导入成功: ${r.successCount} 条`)"
          @error="
            (r) =>
              ElMessage.error(
                `导入失败: ${(r as ImportDialogSubmitResult).description}`
              )
          "
        />
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
      SocketMsg — WebSocket 消息
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section" v-if="false">
      <h3 class="demo-section__title">SocketMsg WebSocket 消息卡片</h3>
      <div class="demo-block">
        <SocketMsg :msg-info="mockWsMessage" />
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
      NoticeBar / NotifyBell / SettingsPanel — 自包含组件
    ══════════════════════════════════════════════════════════════════════════ -->
    <section class="demo-section">
      <h3 class="demo-section__title">NoticeBar 通知滚动条</h3>
      <NoticeBar />
      <p class="demo-section__note">
        自包含组件，自动拉取后端通知数据并在页面顶部滚动展示
      </p>
    </section>

    <section class="demo-section">
      <h3 class="demo-section__title">NotifyBell 消息铃铛</h3>
      <div class="demo-block" style="justify-content: flex-start">
        <NotifyBell />
      </div>
      <p class="demo-section__note">
        自包含组件，读取 Pinia notification store，显示 WebSocket 消息通知
      </p>
    </section>

    <section class="demo-section">
      <h3 class="demo-section__title">SettingsPanel 设置面板（内联模式）</h3>
      <div class="demo-block" style="justify-content: flex-start">
        <SettingsPanel />
      </div>
      <p class="demo-section__note">
        控制主题色 / 暗黑模式 / 导航布局 / 语言 / 动画等全局配置
      </p>
    </section>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 960px;
  margin: 40px auto;
  padding: 0 24px 120px;
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

.demo-section__note {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 8px;
  margin-bottom: 0;
  line-height: 1.6;
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

.demo-block--col {
  flex-direction: column;
  align-items: flex-start;
}

.demo-block--row {
  align-items: center;
}

.demo-block--row .demo-block__label {
  width: auto;
  min-width: 200px;
}

.demo-block__row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.demo-block__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  width: 80px;
  flex-shrink: 0;
  margin: 0;
}

.demo-block__value {
  font-size: 13px;
  color: var(--el-color-primary);
  word-break: break-all;
}

/* ── 功能卡片网格 ──────────────────────────────────────────────────────────── */

.demo-feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.demo-feature-card {
  padding: 16px;
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
}

.demo-feature-card__icon {
  font-size: 20px;
  margin-right: 6px;
}

.demo-feature-card strong {
  display: block;
  margin: 6px 0 4px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.demo-feature-card p {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

/* ── 操作指引 ──────────────────────────────────────────────────────────────── */

.demo-guide-list {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 2;
}

.demo-guide-list b {
  color: var(--el-color-primary);
}

/* ── Props 参考表格 ────────────────────────────────────────────────────────── */

.demo-props-table-wrap {
  margin-top: 8px;
  overflow-x: auto;
}

.demo-props-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.8;
}

.demo-props-table th,
.demo-props-table td {
  padding: 4px 10px;
  border: 1px solid var(--el-border-color-lighter);
  text-align: left;
  white-space: nowrap;
}

.demo-props-table th {
  background: var(--el-fill-color-light);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.demo-props-table code {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 1px 5px;
  border-radius: 3px;
}

/* ── 子标题 ────────────────────────────────────────────────────────────────── */

.demo-sub-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin: 24px 0 12px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}

/* ── 文件图标网格 ──────────────────────────────────────────────────────────── */

.demo-icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  width: 100%;
}

.demo-icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.demo-icon-card__label {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-family: 'SF Mono', Monaco, monospace;
}
</style>
