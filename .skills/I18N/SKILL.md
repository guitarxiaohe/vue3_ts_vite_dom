---
name: i18n-rules
description: 为当前仓库新增或修改页面、组件、提示文案时使用。确保所有用户可见文本接入 vue-i18n，并同步维护 `zh-CN`、`en-US`、`zh-TW` 三份语言包。
metadata:
  short-description: 国际化接入规范
---

# i18n Rules

## 适用场景

- 新增页面、组件、弹窗、抽屉、表单、表格等用户可见文案。
- 修改接口提示、校验提示、按钮文案、占位符、空态、状态文本。
- 修复已有模块中的硬编码中文、英文或繁体文案。

## 目标

- 所有用户可见文本都必须支持国际化切换。
- 文案 key 按页面或组件自身命名空间组织，避免散落。
- 同一轮改动内同步补齐 `zh-CN`、`en-US`、`zh-TW`，不允许只改单语。

## 语言范围

- `zh-CN`
- `en-US`
- `zh-TW`

## key 设计约定

- 优先使用组件或页面命名空间，例如 `fileUpload.placeholder`、`userAvatarInfo.drawerTitle`。
- 通用按钮或通用动作优先复用 `common.*`，仅在真正通用时复用。
- 不要把组件私有文案塞进 `common`。
- 同一组件内 key 命名保持同一语义层级，例如：

```ts
fileUpload: {
  placeholder: '',
  preview: '',
  uploadSuccess: '',
  uploadRetryFailed: '',
}
```

## 实施步骤

1. 先扫描当前改动范围内的所有可见文本。
2. 找到所属命名空间，优先复用已有 key，不重复造轮子。
3. 将模板、脚本、消息提示、tooltip、placeholder、empty、title 等全部替换为 `t(...)`。
4. 同步更新 `src/locales/zh-CN.ts`、`src/locales/en-US.ts`、`src/locales/zh-TW.ts`。
5. 自查是否仍存在硬编码文案、旧 key、漏翻译分支。

## 必查清单

- 模板中的按钮、标题、副标题、占位符。
- `ElMessage`、`ElMessageBox`、`notification`、`tooltip`、`tag` 文案。
- 表单校验、上传校验、错误提示、成功提示。
- 空状态、加载状态、状态枚举文案。
- `props` 默认占位文案和回退文案。

## 执行提醒

- 当前项目真实语言代码是 `zh-CN`、`en-US`、`zh-TW`，不要使用 `zh`、`en`、`tw` 简写落库。
- 只要用户能看到，就要国际化；注释、日志、纯内部调试文本不算。
- 保持最小改动，优先补当前模块，不顺手大范围重命名无关 key。
