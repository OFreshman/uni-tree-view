# Changelog

本项目的显著变更会记录在此文件中，版本号遵循 Semantic Versioning。

## Unreleased

### Added

- 节点整行选择与整行展开开关。
- 自定义过滤方法、关键词高亮和空状态插槽。
- scrollToKey、懒加载错误事件和重试方法。
- 大数据虚拟渲染演示和多平台构建说明。

### Changed

- showCheckbox 只控制选择能力和选择控件，multiple 独立控制单选/多选。
- 优化移动端按压反馈、选择区域、选中态和加载状态。
- 优化文档站示例页实时预览布局：宽屏挂载到右侧栏，窄屏以可折叠卡片展示。
- 文档预览 playground 改用项目 Logo，并移除 H5 路由固定 base 以适配文档内嵌预览。
- Playground 迁移到 Wot UI v2；核心组件仍保持零 Wot UI 依赖。

### Fixed

- 禁用且已选节点继续使用禁用样式。
- 补齐懒加载旋转动画和失败后的重试状态。
