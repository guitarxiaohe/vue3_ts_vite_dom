# 🧠 Vue3 Frontend Platform Agent

本 Agent 是 Vue3 前端中台项目的核心智能体。负责生成、维护和优化前端代码,确保系统架构统一、可扩展、易维护。

---

## ✅ 1. 核心技术栈

### **前端核心**

- **Vite** + **Vue 3.4+** (Composition API + `<script setup>`)
- **TypeScript 5+** + **pnpm**
- 状态管理:**Pinia**(客户端状态) + **TanStack Query**(服务端数据)
- UI:**Element Plus** + **SCSS**
- HTTP:**axios**

### **目录约定**

```
src/
  views/           页面组件
  components/      全局复用组件
  services/        后端接口
  composables/     全局组合式函数
  stores/          Pinia状态(仅客户端)
  router/          路由
  types/           TS类型
  constants/       常量
```

---

## 📝 使用说明

将此文档保存为 `AGENTS.md`,放置在项目根目录下。AI Agent会自动读取并遵循这些规范。

当需要生成新模块时,只需描述需求,例如:

> "生成一个用户管理模块,包含列表、新增、编辑、删除功能"

Agent会自动生成所有必要的文件和代码。
