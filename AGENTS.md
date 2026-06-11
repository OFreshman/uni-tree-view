# AGENTS.md

给在本仓库工作的 AI agent 使用的约束和必要提示。

## 项目边界

- 这是一个 pnpm `10.11.0` workspace，用于开发 uni-app + Vue 3 组件包。
- `packages/core` 是实际发布的 `uni-tree-list` 包；根目录 package 仅用于 workspace 脚本，并保持 `private: true`。
- `playground` 是本地 uni-app H5 演示项目，当前 demo 直接从 `uni-tree-list` 导入 `UniTreeList`。

## 常用命令

- 安装依赖：`pnpm install`。
- 启动 H5 playground：`pnpm play`。
- 构建组件包：`pnpm build`。
- 构建组件包并打包 playground H5：`pnpm build:play`。
- 检查代码：`pnpm lint`、`pnpm lint:type`、`pnpm test`。

## 开发约束

- 文本文件保持 LF 行尾；仓库使用 `.gitattributes` 避免 CRLF 噪音。
- 优先使用 Node/pnpm 脚本，不要新增依赖特定操作系统 shell 的命令。
- 不要写死 Windows 或 macOS 专属路径；路径处理优先使用 package scripts 和 `node:path`。
- `playground/src/pages.json` 和 `playground/src/manifest.json` 是静态 uni-app 配置来源。
- 不要新增 `<route>` 自定义块，除非恢复 `@uni-helper/vite-plugin-uni-pages` 并在 Windows 上验证通过。
- 不要导入 `virtual:uno.css`，除非恢复 UnoCSS 并在 Windows 上验证通过。

## 组件约束

- 主组件：`packages/core/src/components/uni-tree-view/uni-tree-view.vue`。
- 对外类型：`packages/core/src/components/uni-tree-view/types.ts` 和 `packages/core/src/components/uni-tree-view/uni-tree-view.vue.d.ts`。
- 当前基础能力：展开/收起、单选、多选、禁用节点、`v-model`、`checked`、`goChild` 和 `updated`。
- `treeProps` 用于映射 `id`、`label`、`children`、`disabled` 字段名。
- 修改组件能力时，保持运行时 props/emits 和 `.d.ts` 类型同步。

## 测试约束

- 在继续 P1/P2 功能前，优先补齐轻量业务逻辑测试，覆盖已有能力，避免交互回归。
- 测试按展开、选中、半选、禁用、受控值、默认值、公开方法和事件 payload 等行为分组。
- 优先抽离可测试的纯逻辑或使用最小组件场景；不要为单个逻辑用例引入沉重的跨平台 E2E 依赖。
- 功能开发完成后，先跑业务逻辑测试，再跑构建验证；测试失败时先修业务行为。

## 构建提示

- `packages/core/package.json` 中的 `uni-tree-list/resolver` 导出指向 `dist-resolver/index.*`。
- 构建时会先生成 `dist-resolver/resolver/*`，随后 `scripts/post-build.ts` 会移动到 `dist-resolver/index.*`。
- 如果 unbuild 提示找不到 `dist-resolver/index.*`，先确认 post-build 结束后的最终文件是否存在，再考虑改 exports。

## 提交约束

- 提交信息使用 `feat:`、`fix:`、`docs:`、`style:`、`refactor:`、`test:`、`chore:` 等类型前缀加中文说明，简洁描述本次提交的实际变更。
- 提交前检查暂存区，按功能边界分批提交；提交代码时无特别说明，就按功能逐批提交。

## 参考资料

- 如需大量查询 uni-app API 或平台差异，可单独安装/使用社区 skill：`https://www.skills.sh/teachingai/full-stack-skills/uniapp-project`。
- 不要把该 skill vendoring 或复制进仓库；本仓库规则以当前 `AGENTS.md` 为准。

## 交付前验证

做了有意义的代码修改后，交付前运行：

```bash
pnpm lint
pnpm lint:type
pnpm test
pnpm build:play
git diff --check
```

已知的非阻断输出：

- Browserslist 可能提示 `caniuse-lite` 数据较旧。
- unbuild 可能在 post-build 移动 resolver 文件前提示 resolver 导出文件缺失。
