# AGENTS.md

给在这个仓库里工作的 AI agent 使用的项目说明。

## 项目结构

- 这是一个 pnpm workspace，用于开发 uni-app + Vue 3 组件包。
- `packages/core` 是实际发布的 `uni-tree-list` 包。
- `playground` 是本地 uni-app H5 演示项目。
- 根目录 package 只用于 workspace 脚本，保持 `private: true`。

## 包管理和脚本

- 使用 pnpm `10.11.0`。
- 安装依赖：`pnpm install`。
- 启动 H5 playground：`pnpm play`。
- 构建组件包：`pnpm build`。
- 构建组件包并打包 playground H5：`pnpm build:play`。
- 检查代码：`pnpm lint` 和 `pnpm lint:type`。

## 跨平台注意事项

- 文本文件保持 LF 行尾。仓库使用 `.gitattributes`，避免 Windows 和 macOS 来回开发产生 CRLF 噪音。
- 优先使用 Node/pnpm 脚本，不要新增依赖某个操作系统 shell 的命令。
- 不要写死 Windows 或 macOS 专属路径假设。路径处理优先使用 package scripts 和 `node:path`。
- `playground` 的 Vite 配置目前刻意保持精简。有些 helper 插件在 Windows 下可能触发 ESM 路径错误，例如 `Received protocol 'c:'`。

## Playground 约定

- `playground/src/pages.json` 和 `playground/src/manifest.json` 是静态 uni-app 配置来源。
- 不要新增 `<route>` 自定义块，除非恢复 `@uni-helper/vite-plugin-uni-pages` 并在 Windows 上验证通过。
- 不要导入 `virtual:uno.css`，除非恢复 UnoCSS 并在 Windows 上验证通过。
- 当前 playground demo 直接从 `uni-tree-list` 导入 `UniTreeList`。

## 组件约定

- 主组件：`packages/core/src/components/uni-tree-list/uni-tree-list.vue`。
- 对外类型：`packages/core/src/components/uni-tree-list/types.d.ts`。
- 当前基础能力：展开/收起、单选、多选、禁用节点、`v-model`、`checked`、`goChild` 和 `updated`。
- `treeProps` 用于映射 `id`、`label`、`children`、`disabled` 字段名。
- 修改组件能力时，要保持运行时 props/emits 和 `.d.ts` 类型同步。

## 构建产物

- `packages/core/package.json` 中的 `uni-tree-list/resolver` 导出指向 `dist-resolver/index.*`。
- 构建时会先生成 `dist-resolver/resolver/*`，随后 `scripts/post-build.ts` 会移动到 `dist-resolver/index.*`。
- 如果 unbuild 提示找不到 `dist-resolver/index.*`，先确认 post-build 结束后的最终文件是否存在，再考虑改 exports。

## 社区 Skill

- 社区里有一个 uni-app skill：`https://www.skills.sh/teachingai/full-stack-skills/uniapp-project`。
- 它是通用 uni-app 参考资料，覆盖 API、组件、路由、生命周期、样式、存储、网络和平台兼容等内容。
- 默认不要把这个 skill vendoring 或安装进本仓库。本仓库的规则以这个项目本地的 `AGENTS.md` 为准。
- 如果后续任务需要查大量 uni-app API 或平台差异，再单独安装/使用该社区 skill，不要把完整参考资料复制进仓库。

## 交付前验证

做了有意义的代码修改后，交付前运行：

```bash
pnpm lint
pnpm lint:type
pnpm build:play
git diff --check
```

已知的非阻断输出：

- Browserslist 可能提示 `caniuse-lite` 数据较旧。
- unbuild 可能在 post-build 移动 resolver 文件前提示 resolver 导出文件缺失。
