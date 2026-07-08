<script setup lang="ts"></script>

<template>
  <div class="app-container">
    <!-- <HeaderText /> -->

    <main class="home-content">
      <section class="home-section">
        <h2>项目简介</h2>
        <p>
          <strong>xiaoheDOM</strong>
          — 基于 Vue 3 + TypeScript + Vite + Element Plus + Pinia
          的全栈后台管理系统，支持实时会议、AI 辅助、代码生成等业务场景。
          核心理念是<em>「配置驱动、约定优于编码」</em>，通过一套实体模块系统 将
          CRUD 场景的重复代码降到最低。
        </p>
      </section>

      <section class="home-section">
        <h2>技术栈</h2>
        <div class="home-grid">
          <div class="home-card">
            <h3>框架</h3>
            <p>Vue 3.5 + TypeScript 5.9</p>
          </div>
          <div class="home-card">
            <h3>构建</h3>
            <p>Vite 8</p>
          </div>
          <div class="home-card">
            <h3>UI</h3>
            <p>Element Plus 2.5 + Tailwind CSS</p>
          </div>
          <div class="home-card">
            <h3>状态</h3>
            <p>Pinia 2.1</p>
          </div>
          <div class="home-card">
            <h3>实时通信</h3>
            <p>LiveKit RTC + WebSocket</p>
          </div>
          <div class="home-card">
            <h3>国际化</h3>
            <p>zh-CN / en-US / zh-TW</p>
          </div>
        </div>
      </section>

      <section class="home-section">
        <h2>框架设计思路</h2>

        <div class="home-module">
          <h3>1. 实体模块系统 — 约定式自动注册</h3>
          <p>
            每个业务实体（用户、角色、菜单…）是
            <code>features/entities/&lt;key&gt;/module.ts</code> 下的独立文件。
            通过
            <code
              >import.meta.glob('./**/module.ts', &#123; eager: true
              &#125;')</code
            >
            自动收集所有模块，零手动注册。新增实体只需创建一个目录和 module.ts。
          </p>
          <pre class="home-code">
// features/entities/user/module.ts — 30 行搞定一个完整 CRUD 页面
export default createEntityModule(&#123;
  entityKey: 'user',
  formComponent: UserForm,        // 新增/编辑表单组件
  formSubmit: userSaveService,    // 提交逻辑
  config: &#123;
    title: '用户管理',
    actions: &#123; showImport: true, showExport: true &#125;,
    table: &#123; pageSize: 20 &#125;,
  &#125;,
  rowActions: &#123; showEdit: true, showDelete: true &#125;,
  batchActions: [BatchDeleteButton],
&#125;);</pre
          >
          <p>
            模块声明后即自动获得：分页列表、新增/编辑/复制抽屉、
            行内删除、批量操作、导入导出、详情抽屉、子表关联。
          </p>
        </div>

        <div class="home-module">
          <h3>2. 动态路由 — 后端驱动菜单</h3>
          <p>
            菜单由后端接口返回树形结构，前端
            <code>registerDynamicRoutes()</code>
            将其转换为 Vue Router 路由，自动解析
            <code>component</code> 字段到本地 views 目录（通过
            <code>import.meta.glob</code> 索引）。
            支持多级嵌套、权限控制、路由缓存策略。后端新增菜单无需前端改动。
          </p>
        </div>

        <div class="home-module">
          <h3>3. Table-Entity 通用表格 — 三种数据模式</h3>
          <ul class="home-list">
            <li>
              <strong>函数模式</strong> — 父组件传入
              <code>data: (query) =&gt; Promise</code>，完全自定义拉表逻辑
            </li>
            <li>
              <strong>实体模式</strong> — 传入
              <code>entityKey</code>，自动调用通用列表接口
            </li>
            <li>
              <strong>静态模式</strong> — 传入数组
              <code>data: [...]</code>，适合小数据场景
            </li>
          </ul>
          <p>
            内置能力：Element Plus TableV2 虚拟滚动、列宽拖拽、字段排序、
            列显隐设置面板、行详情抽屉（支持上下翻页）、子表嵌入、自定义列插槽。
          </p>
        </div>

        <div class="home-module">
          <h3>4. Form-Shell 表单抽屉 — 字段驱动渲染</h3>
          <p>
            <code>FormDrawer</code> 提供统一的表单抽屉容器，通过字段配置数组
            驱动表单渲染。支持：新增/编辑/复制模式切换、字段级校验、
            自定义插槽注入、子表嵌套编辑、上下条记录导航。
          </p>
        </div>

        <div class="home-module">
          <h3>5. Composable 组合式架构 — 关注点分离</h3>
          <p>
            复杂业务逻辑封装为独立 composable，遵循单一职责。
            组件只做模板编排，逻辑全部下沉。以外部会议为例拆分为 4 个
            composable：
          </p>
          <ul class="home-list">
            <li>
              <code>useLivekitRoom</code> — LiveKit
              房间连接/断开、音视频轨道管理、屏幕共享采集
            </li>
            <li>
              <code>useMeetingRtcSession</code> — RTC
              会话生命周期、自动加入/离开、麦克风权限、跨标签页所有权
            </li>
            <li>
              <code>useMeetingScreenShare</code> — 屏幕共享推流/观看、视频轨 DOM
              挂载、全屏提示、页面卸载清理
            </li>
            <li>
              <code>useMeetingParticipants</code> —
              参与者列表、邀请/移除、在线状态、RTC 连接状态映射
            </li>
          </ul>
        </div>

        <div class="home-module">
          <h3>6. WebSocket 实时状态同步</h3>
          <p>
            基于 <code>useWebSocket</code> 统一封装，会议模块通过
            <code>meeting_screen_share_state</code>、
            <code>meeting_live_summary</code>、
            <code>meeting_interaction</code> 等消息类型
            实时同步跨客户端状态。Store 层负责消息分发和状态持久化。
            页面卸载场景使用 <code>fetch + keepalive</code> 可靠通知服务端。
          </p>
        </div>
      </section>

      <section class="home-section">
        <h2>核心业务模块</h2>

        <div class="home-module">
          <h3>外部会议 (external-meeting)</h3>
          <p>
            实时会议全功能：LiveKit 语音通话、屏幕共享推流/观看、 AI
            流式实时总结、语音转写、互动聊天（文字/举手/表情）、
            参与者管理（邀请/移除/状态展示）。
          </p>
        </div>

        <div class="home-module">
          <h3>数据分析 (analysis)</h3>
          <p>
            客服分析 &amp; 会议分析，集成 ECharts 柱状图/折线图/饼图、指标卡片。
          </p>
        </div>

        <div class="home-module">
          <h3>实体管理 (entity + features/entities)</h3>
          <p>
            基于动态实体配置的通用 CRUD 系统，支持用户/角色/菜单/字典等 30+
            实体的表单、列表、导入导出、批量操作。
          </p>
        </div>

        <div class="home-module">
          <h3>系统监控 (monitor)</h3>
          <p>在线用户、缓存监控、Druid 数据源、服务器状态。</p>
        </div>

        <div class="home-module">
          <h3>代码生成 (tool)</h3>
          <p>代码构建器、生成器、Swagger 文档预览。</p>
        </div>
      </section>

      <section class="home-section">
        <h2>目录结构</h2>
        <pre class="home-tree">
src/
├── views/                    # 页面
│   ├── external-meeting/     #   ★ 外部会议（核心业务）
│   ├── analysis/             #   数据分析
│   ├── entity/               #   通用 CRUD
│   ├── login/                #   登录（含动画眼球组件）
│   ├── monitor/              #   系统监控
│   ├── tool/                 #   代码生成
│   └── ...
├── components/               # 全局通用组件
│   ├── table-entity/         #   通用表格（虚拟滚动+分页+行详情）
│   ├── meeting-participant-grid/ # 会议参与者网格
│   ├── async-select/         #   异步远程搜索下拉
│   └── ...
├── composables/              # 通用 composables
│   ├── use-livekit-room.ts   #   LiveKit RTC 房间封装
│   ├── use-websocket.ts      #   WebSocket 封装
│   └── ...
├── stores/modules/           # Pinia 状态管理
│   ├── meeting.ts            #   会议状态（消息分发、RTC、共享）
│   ├── user.ts               #   用户 & 权限
│   └── ...
├── features/entities/        # 实体业务模块（模块化 CRUD）
│   ├── _shared/              #   通用工厂 & 适配器
│   ├── user/                 #   用户管理
│   ├── role/                 #   角色管理
│   ├── meetingSession/       #   会议会话
│   └── ... (30+ 实体)
├── features/form-shell/      # 表单抽屉通用容器
├── features/multiview/       # 多视图列表（筛选+操作+导入导出）
├── api/modules/              # API 接口层
├── router/                   # 路由配置（动态路由 + 权限）
├── locales/                  # 国际化语言包
├── utils/                    # 工具函数
└── types/                    # 全局类型定义</pre
        >
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  background: #f5f5f7;
}

.home-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

.home-section {
  margin-bottom: 40px;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: #1d1d1f;
    margin: 0 0 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #4f46e5;
  }
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.home-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
    margin: 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  p {
    font-size: 15px;
    font-weight: 600;
    color: #1d1d1f;
    margin: 0;
  }
}

.home-module {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #4f46e5;

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1d1d1f;
    margin: 0 0 6px;
  }

  p {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.65;
    margin: 0;
  }
}

.home-list {
  margin: 8px 0 0;
  padding-left: 20px;

  li {
    font-size: 14px;
    color: #4b5563;
    line-height: 1.7;
    margin-bottom: 4px;

    code {
      background: #f3f4f6;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 13px;
      color: #4f46e5;
    }
  }
}

.home-code {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 8px;
  padding: 16px 20px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.7;
  overflow-x: auto;
  margin: 10px 0 0;
}

.home-tree {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 12px;
  padding: 24px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.8;
  overflow-x: auto;
  margin: 0;
}

@media (max-width: 640px) {
  .home-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .home-content {
    padding: 0 16px 60px;
  }
}
</style>
