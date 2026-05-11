---
name: comment-rules
description: Apply the repository's comment rules. Use when adding or modifying code that requires concise Chinese comments, function notes, variable type clarity, or template/script/type block separators in this project.
metadata:
  short-description: 项目注释约束
---

# Comment Rules

## 适用场景

- 在当前仓库内新增或修改代码时使用。

## 必须遵守

- 新增或修改代码时，补充简略注释，说明代码用途或关键逻辑。
- 新增或修改函数、方法时，为每个函数或方法补充简略备注。
- 新增或修改变量定义时，补充清晰直接的类型声明。
- 注释保持简短直接，不写逐行解释，不写与代码语义重复的内容。

## 注释格式

- `script` 中函数和方法的大类集中放在同一个代码块中。
- `script` 分块统一使用：

```text
/******************************** xxxxxx ********************************/
```

- `TypeScript` 类型文件中的类型定义按模块集中放在types/\*同一个代码块中。
- 类型模块分隔统一使用：

```text
/******************************** xxxxxx ********************************/
```

- 类型模块内的分类型说明统一使用：

```text
// xxxxxx
```

- 代码块中的函数、方法备注统一使用：

```text
// xxxxxx
```

- `template` 模板中每个模块之间统一使用：

```html
<!-------------------------- xxxxxx -------------------------->
```

## 执行提醒

- 保持最小改动，只补当前改动必须的注释。
- 注释风格与现有文件保持一致，不主动重构已有结构。
