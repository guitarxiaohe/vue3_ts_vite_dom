# 项目结构
tsrc/
├── api/
│   ├── modules/           # API 接口模块
│   │   ├── user.ts
│   │   └── product.ts
│   ├── mock/              # 模拟数据
│   │   ├── user.ts
│   │   └── product.ts
│   └── client.ts          # HTTP 请求客户端
├── stores/
│   └── modules/           # Pinia Store
│       ├── user.ts
│       ├── product.ts
│       └── app.ts
├── router/
│   ├── index.ts           # 路由配置
│   └── guards.ts          # 路由守卫
├── composables/
│   └── useQuery.ts        # TanStack Query 封装
├── types/
│   └── api.ts             # 类型定义
├── views/                 # 页面组件
├── layouts/               # 布局组件
├── App.vue
└── main.ts

### 插件选择
- 请求插件：tankqueryvue
- 状态管理：paina
- 路由管理：router
- UI 库：Element-plus
