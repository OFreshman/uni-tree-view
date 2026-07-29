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
artifacts       本地发布产物（插件 ZIP、说明文档、示例工程 ZIP）
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
- 更新 `docs/` 对应 API 文档和 `CHANGELOG.md` 的 Unreleased 段落

## 提交规范

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 增加 xxx 能力
fix: 修复 xxx 在支付宝小程序下的表现
docs: 补充 xxx 示例
```

## 发布流程（维护者）

变更日志只维护仓库根目录 `CHANGELOG.md` 的 `Unreleased`；npm 包内的 `CHANGELOG.md` 会在打包前自动生成。

```bash
pnpm check           # 提交功能代码前完整检查
git commit           # 按功能边界提交，不把版本升级混入功能提交
pnpm release patch   # 升级版本、归档 CHANGELOG、再次检查 H5/微信/支付宝、创建 release commit 和 tag
git show HEAD        # 人工确认版本和 CHANGELOG 内容
git tag --points-at HEAD
pnpm release:push    # 最后一次性推送 main 和 tag
```

推送 tag 后，GitHub Actions 会再次检查、验证微信/支付宝 playground 构建、发布 npm，并将 DCloud ZIP 上传到 GitHub Release。DCloud 插件市场仍需维护者下载该 ZIP 后手动上传。
