# 贡献指南

感谢你愿意为 uni-tree-view 做贡献！

## 项目定位

在动手前请了解本项目的两条设计约束：

1. **移动端体积与性能敏感**——核心包保持零运行时依赖，不内置搜索框、弹窗等可由业务组合实现的能力。
2. **跨端一致**——所有能力必须在微信小程序、支付宝小程序和 H5 上行为一致，不使用单端专属 API。

超出树组件核心职责的功能建议先开 issue 讨论。

## 开发环境

- Node.js LTS + pnpm 10.11.0（仓库已声明 `packageManager`）
- 文本文件使用 LF 行尾

```bash
pnpm install        # 安装依赖
pnpm play           # 启动 H5 playground
pnpm play:mp-weixin # 微信小程序调试（需微信开发者工具）
pnpm docs           # 启动文档站
```

## 目录结构

```
packages/core   组件包本体（发布为 uni-tree-view）
playground      uni-app 演示工程
docs            VitePress 文档站
test            单元测试
scripts         构建脚本（build:uni 生成 DCloud 发布文件）
artifacts       本地发布产物（插件 ZIP、说明文档、示例工程 ZIP、npm 包 tgz）
```

## 提交前检查

```bash
pnpm lint       # ESLint
pnpm lint:type  # tsc --noEmit
pnpm test       # Vitest
pnpm build      # 构建组件包
```

修改组件能力时请注意：

- 运行时 props/emits 与 `types.ts`、`uni-tree-view.vue.d.ts` 保持同步
- 补充对应的单元测试（按展开/选中/禁用/事件 payload 等行为分组）
- 更新 `docs/` 对应 API 文档；需要人工整理发布说明时再填写根目录 `CHANGELOG.md` 的 Unreleased 段落

## 提交规范

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 增加 xxx 能力
fix: 修复 xxx 在支付宝小程序下的表现
docs: 补充 xxx 示例
```

提交标题会由本地 `commit-msg` hook 校验，CI 还会检查 PR 标题以及变更范围内的全部非 merge 提交，格式为 `<type>(<scope>)!: <description>`。允许的类型包括 `build`、`chore`、`ci`、`docs`、`feat`、`fix`、`perf`、`refactor`、`revert`、`style` 和 `test`；其中 `feat`、`fix`、`perf`、`refactor` 以及带破坏性标记的提交会进入自动发布说明。使用 squash merge 时，PR 标题也必须遵循同一格式。

## 版本与发布说明

贡献者只需按功能边界提交代码、测试和文档。版本号、release commit、tag、npm 发布和 DCloud 插件市场发布由项目维护者统一处理，请不要在功能提交中修改版本号。

变更日志只维护仓库根目录 `CHANGELOG.md`；npm 包内的 `CHANGELOG.md` 会在打包前自动生成。提交类型会用于整理发布说明，需要补充迁移步骤、兼容性变化或其他无法从提交标题表达的信息时，请更新根目录 `CHANGELOG.md` 的 `Unreleased` 段落。
