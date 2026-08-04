# Changelog

本项目的显著变更会记录在此文件中，版本号遵循 Semantic Versioning。

## Unreleased

## 0.3.2 - 2026-08-04

### Fixed

- 修复 GitHub Pages 示例预览 404。

## 0.3.1 - 2026-08-01

### Fixed

- 修复在线演示未使用 hash 路由导致页面直达失败的问题，并补充 Netlify 部署回退配置。

## 0.3.0 - 2026-08-01

### Changed

- 新增 `packDisabledKey` / `pack-disabled-key` 规范命名，并暂时保留旧 `packDisabledkey` / `pack-disabledkey` 作为废弃别名。
- 优化选中事件 payload 构建与受控 `v-model` 等价回流，避免重复遍历和不必要的全量选中态重放。
- 为组件公开实例方法增加 `UniTreeViewExposed` 编译期一致性校验，并补充懒加载公开方法的行为说明。
- 明确 `uni-tree-view/shared` 继续提供共享运行时工具，并清理 resolver 中无关的模板注释。

### Fixed

- 修复全选、清空、父子联动和受控值回放可能绕过 `checked-disabled` 改变禁用节点状态的问题。
- 修复 `mitt` 通配监听器未接收事件类型的问题。

### Tests

- 补充整行点击组合行为、空状态插槽、关键词高亮、普通模式滚动、属性兼容迁移、受控行为切换和共享工具契约测试。

## 0.2.0 - 2026-07-31

### Changed

- 规范组件内部 SCSS 元素类与状态类命名，保留 `nodeClass` 公开样式入口不变。

### Tests

- 按结构与展开、选择、懒加载拆分树状态测试，并补齐组件公开事件 payload 的集成链路验证。

## 0.1.0 - 2026-07-30

### Fixed

- npm 发布迁移到 GitHub Actions Trusted Publishing，并支持手动重试已有发布标签。
- 规范 npm 包仓库元数据，并升级 Release workflow 的 Node 环境 Action 至 v7，消除 npm 11 发布警告。

## 0.0.9 - 2026-07-29

### Fixed

- 修复 GitHub Actions 发布标签校验脚本被 shell 提前解析导致发布中断的问题。
- 发布前预检变更日志，并在 bumpp 执行失败且尚未创建提交时自动恢复被修改的跟踪文件。

## 0.0.8 - 2026-07-29

### Added

- 节点整行选择与整行展开开关。
- 增加 `node-class` 一级属性，作为每个节点行的外部样式入口。
- 自定义过滤方法、关键词高亮和空状态插槽。
- scrollToKey、懒加载错误事件和重试方法。
- 大数据虚拟渲染演示和多平台构建说明。

### Changed

- **Breaking:** 选择入口由 `showCheckbox` 更名为 `selectable`，选择控件位置由 `checkboxPlacement` 更名为 `selectionPlacement`，旧属性不再保留。
- **Breaking:** 选中与展开事件统一为 `check-change` 和 `expand-change`，选中事件类型更名为 `TreeCheckChangePayload`。
- `treeProps` 只负责 `id`、`label`、`children`、`disabled`、`leaf`、`append`、`icon` 数据字段映射；节点行样式统一通过一级 `nodeClass` 属性传入。
- 优化移动端按压反馈、选择区域、选中态和加载状态。
- 优化文档站示例页实时预览布局：宽屏挂载到右侧栏，窄屏以可折叠卡片展示。
- 文档预览 playground 改用项目 Logo，并移除 H5 路由固定 base 以适配文档内嵌预览。
- Playground 迁移到 Wot UI v2；核心组件仍保持零 Wot UI 依赖。

### Removed

- 移除 `field`、`labelField`、`valueField`、`childrenField`、`disabledField`、`leafField`、`appendField`、`iconField` 等旧字段映射属性，统一使用 `treeProps`。
- 移除 `defaultExpandedIds` 展开别名，统一使用 `defaultExpandedKeys`。
- 移除 `change`、`checked`、`updated`、`expand`、`goChild` 等历史事件别名。
- 移除 `treeProps.class` 样式映射，改用 `nodeClass`。

### Fixed

- 禁用且已选节点继续使用禁用样式。
- 补齐懒加载旋转动画和失败后的重试状态。
