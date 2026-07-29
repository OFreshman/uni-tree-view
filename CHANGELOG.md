# Changelog

本项目的显著变更会记录在此文件中，版本号遵循 Semantic Versioning。

## Unreleased

### Fixed

- npm 发布迁移到 GitHub Actions Trusted Publishing，并支持手动重试已有发布标签。

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
