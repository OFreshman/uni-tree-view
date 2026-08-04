# 发布流程（Release Runbook）

本文档是 `uni-tree-view` 的维护者发布手册。后续正式版本发布以本文档为准，目标是让每次发布都满足：

- 功能、类型、测试、文档和变更日志保持同步；
- 版本提交与功能提交分离；
- npm、GitHub Release、文档站和 DCloud 插件市场使用同一版本；
- 发布失败时可以明确判断是重试、回滚，还是发布修复版本。

> 根目录 package 仅用于 pnpm workspace 管理，并保持 `private: true`；真正发布到 npm 的包是 `packages/core` 下的 `uni-tree-view`。

### 先看结论：本地提交尚未 push 时如何发布

功能提交已经在本地 `main`、但尚未 push，是允许且推荐支持的发布场景。只要本地 `main` 已包含最新的 `origin/main`，就可以直接执行：

```bash
pnpm release
# 选择并确认版本后，人工复核 release commit 和 tag
pnpm release:push
```

两条命令的职责必须区分清楚：

- `pnpm release` 会从 Git 提交准备 CHANGELOG、更新版本、运行发布前检查、创建 release commit，并自动创建 `v<version>` tag；它不会 push；
- 不要在 `pnpm release` 后手动执行 `git tag`，也不要为了“继续发布”再次运行 `pnpm release`；
- `pnpm release:push` 只会执行 `git push origin main --follow-tags`，把本地 `main` 的功能提交、release commit 和自动生成的 tag 一起推送；它不会再次修改版本号；
- tag 推送到 GitHub 后才会触发 Release workflow 和 npm 发布，因此在执行 `pnpm release:push` 前仍可安全地做最终复核。

发布过程可以理解为三个状态：

```text
功能提交已完成，但只存在于本地 main
  → pnpm release
本地新增 release commit 和 v<version> tag，远端仍未变化
  → pnpm release:push
main 与 tag 被推送，GitHub Actions 开始发布 npm、GitHub Release 和文档
```

### 核心命令分别解决什么问题

| 命令 | 为什么要运行 | 会修改本地吗 | 会影响远端或触发发布吗 |
| --- | --- | --- | --- |
| `git fetch origin --prune --tags` | 获取远端最新分支和 tag，用来判断本地是否落后或版本 tag 是否冲突 | 只更新远端跟踪引用，不改工作区和本地提交 | 否 |
| `git pull --ff-only origin main` | 在发布前吸收远端新提交，同时禁止自动生成意外的 merge commit | 远端领先时会安全快进本地 `main` | 否 |
| `git status --short --branch` | 确认分支、ahead/behind 状态和工作区是否干净 | 否 | 否 |
| `git log --oneline origin/main..main` | 列出尚未 push、稍后会随发布一起推送的本地提交 | 否 | 否 |
| `pnpm check` / `pnpm check:platforms` | 在改版本和打 tag 前尽早发现代码、类型、测试或构建问题 | 可能产生已忽略的构建目录，不应修改跟踪文件 | 否 |
| `pnpm commit:check --range "<base>..<head>"` | 校验指定范围内全部非 merge 提交的 Conventional Commit 标题 | 否 | 否 |
| `pnpm changelog:check` | 只读检查最近版本 tag 后是否存在可生成发布说明的 Conventional Commits，或已有手写 `Unreleased` | 否 | 否 |
| `pnpm changelog` | 当 `Unreleased` 为空时，从最近版本 tag 后的提交生成发布说明；已有内容时保持不变 | 是：可能修改根目录 `CHANGELOG.md` | 否 |
| `pnpm changelog:generate --force` | 放弃现有手写 `Unreleased`，根据提交重新生成发布说明 | 是：替换根目录 `CHANGELOG.md` 的 `Unreleased` | 否 |
| `pnpm release` | 选择版本，归档 CHANGELOG，重新检查，并创建 release commit/tag | 是：修改版本文件、CHANGELOG，并创建本地 commit/tag | 否 |
| `git tag --points-at HEAD` | 确认 tag 正确指向当前 release commit，避免推错提交 | 否 | 否 |
| `pnpm release:push` | 把本地功能提交、release commit 和 tag 一次性送到正式仓库 | 不修改版本；只更新远端跟踪状态 | 是：tag 会触发 Release workflow |

最重要的边界是：**`pnpm release` 只在本地准备发布，`pnpm release:push` 才是真正对外发布的开关。**

## 一、标准发布链路

```text
开发分支完成改动与测试
  → 使用 Conventional Commits 按功能边界提交代码
  → 按需手写根目录 CHANGELOG.md 的 Unreleased 覆盖自动生成内容
  → 合并到本地 main，并确认本地 main 包含最新 origin/main
  → pnpm check + pnpm check:platforms
  → pnpm release <patch|minor|major>
  → 人工复核 release commit 和 tag
  → pnpm release:push
  → GitHub Actions 独立执行 CI / Release / Docs
  → 验收 npm、GitHub Release、文档站
  → 手动上传 DCloud 插件市场
```

## 二、发布前检查清单

发布环境应使用仓库声明的 Node.js 22 和 pnpm 10.11.0。发布前逐项确认：

- [ ] `node --version` 为 Node.js 22，`pnpm --version` 为 10.11.0；
- [ ] 本次功能、修复、类型声明、测试和文档已经完成；
- [ ] 本次可发布变更使用 `feat:`、`fix:`、`perf:`、`refactor:` 或破坏性变更格式提交，或者根目录 `CHANGELOG.md` 的 `## Unreleased` 已有手写内容；
- [ ] 所有功能变更已经按边界提交，不存在未提交文件；
- [ ] 改动已经合并到 `main`；
- [ ] 本地 `main` 已同步最新的 `origin/main`；
- [ ] `pnpm check` 通过；
- [ ] `pnpm check:platforms` 通过；
- [ ] 已根据语义化版本规则确定本次版本类型；
- [ ] `origin` 指向用于发布的 GitHub 仓库。

## 三、开发完成后的准备工作

### 1. 补齐测试、类型和文档

修改组件能力时，至少检查以下文件是否需要同步：

- 主组件：`packages/core/src/components/uni-tree-view/uni-tree-view.vue`
- 对外类型：`packages/core/src/components/uni-tree-view/types.ts`
- Vue 类型声明：`packages/core/src/components/uni-tree-view/uni-tree-view.vue.d.ts`
- 业务逻辑测试：`test/`
- API 和示例文档：`docs/`、`playground/`

测试应优先覆盖展开、选中、半选、禁用、受控值、默认值、公开方法和事件 payload 等行为。

### 2. 准备 CHANGELOG 来源

正常情况下不需要提前编辑 CHANGELOG。发布脚本会读取最近版本 tag 到 `HEAD` 的非 merge 提交，并按 Conventional Commits 生成根目录 `CHANGELOG.md` 的 `## Unreleased`：

| 提交格式 | CHANGELOG 分类 |
| --- | --- |
| `feat:` | `### Added` |
| `fix:` | `### Fixed` |
| `perf:`、`refactor:` | `### Changed` |
| `type(scope)!:` 或正文中的 `BREAKING CHANGE:` / `BREAKING-CHANGE:` | `### Changed`，并标记 `**Breaking:**` |
| `build:`、`chore:`、`ci:`、`docs:`、`style:`、`test:` | 默认忽略 |

例如以下提交：

```text
feat(tree): 支持节点拖拽
fix: 修复 GitHub Pages 示例预览 404
```

会生成：

```markdown
## Unreleased

### Added

- **tree:** 支持节点拖拽。

### Fixed

- 修复 GitHub Pages 示例预览 404。
```

要求：

- commit description 会直接成为发布说明，应描述“使用者能感知的变化”，避免只写内部实现细节；
- scope 会生成为粗体前缀，例如 `feat(tree): ...` 会生成 `**tree:** ...`；
- 破坏性变更使用 `!` 或 `BREAKING CHANGE:` 明确标记，并在描述中说明影响和迁移方式；
- 如需人工整理、合并多条提交或补充更完整的迁移说明，可以直接填写根目录的 `Unreleased`；发布时只要该段非空，就会优先保留手写内容，并在终端打印本次被跳过的自动条目供人工核对；
- 手写内容已经过期、需要完全按提交重新生成时，运行 `pnpm changelog:generate --force`；该命令会替换整个 `Unreleased`，运行前应确认其中没有需要保留的人工说明；
- 如果既没有可生成发布说明的提交，`Unreleased` 也为空，`pnpm release` 才会拒绝执行；
- 不要手动编辑 `packages/core/CHANGELOG.md`，该文件会在 npm 打包前从根目录自动生成；
- 可用 `pnpm changelog:check` 做只读预检；正常发布不需要提前运行 `pnpm changelog`，因为 `pnpm release` 会在内部自动生成并归档；
- 如果主动运行了 `pnpm changelog`，应先复核生成内容，并在继续发布前提交或恢复该改动，保证发布开始时工作区干净。

### 3. 运行完整检查

```bash
pnpm check
pnpm check:platforms
```

`pnpm check` 依次执行：

| 检查 | 实际命令 | 目的 |
| --- | --- | --- |
| 代码规范 | `pnpm lint` | ESLint 检查 |
| 类型检查 | `pnpm lint:type` | 检查 workspace、core 和 playground 类型 |
| 业务测试 | `pnpm test` | 运行 Vitest 测试 |
| H5 构建 | `pnpm build:play` | 构建组件包和 playground H5 |
| Git 空白检查 | `git diff --check` | 检查行尾和多余空白 |

`pnpm check:platforms` 会继续构建：

- 微信小程序：`pnpm -C playground build:mp-weixin`
- 支付宝小程序：`pnpm -C playground build:mp-alipay`

正式发布前两条命令都应通过。虽然 `pnpm release` 会再次执行这些检查，但提前执行可以避免版本文件修改后才发现问题。

### 4. 按功能边界提交

```bash
git add <功能相关文件>
git commit -m "feat: 新增 XXX 功能"

git add <测试相关文件>
git commit -m "test: 补充 XXX 测试"

git add <文档相关文件>
git commit -m "docs: 更新 XXX 文档"
```

提交标题统一使用 `<type>(<scope>)!: <description>` 格式，允许的类型为 `build`、`chore`、`ci`、`docs`、`feat`、`fix`、`perf`、`refactor`、`revert`、`style` 和 `test`，正文使用简洁中文。需要进入 CHANGELOG 的变更应优先使用 `feat:`、`fix:`、`perf:` 或 `refactor:`；其他类型默认不会生成发布说明。

> `commit-msg` hook 会校验提交标题，`pre-commit` hook 会通过 `lint-staged` 对已暂存的 JS、TS、TSX、Vue 和 JSON 文件运行 `eslint --fix`。两者都在执行 `git commit` 时触发，而不是在 `git add` 时触发。提交后应再次检查是否仍有未提交的自动修复内容。

## 四、进入 main 并执行发布

### 5. 同步 main

可以先通过 PR 合并开发分支，也可以在本地把开发分支合并到 `main`。功能提交不要求在 release 前单独 push，但必须先确认本地 `main` 没有落后或偏离远端：

```bash
git switch main
git fetch origin --prune --tags
git pull --ff-only origin main
git status --short --branch
git log --oneline origin/main..main
git remote get-url origin
pnpm install --frozen-lockfile
```

确认：

- 当前分支是 `main`；
- 本地 `main` 必须包含最新的 `origin/main`，不能处于 behind 或 diverged 状态；
- 本地 `main` 可以 ahead；ahead 的功能提交会在 `pnpm release:push` 时与 release commit、tag 一起推送；
- `git status --short` 没有输出，所有功能以及可选的手写 CHANGELOG 改动都已经提交；
- `origin` 是 `https://github.com/OFreshman/uni-tree-view.git`，或对应的正式 GitHub 发布仓库；
- 最近版本 tag 之后存在可生成发布说明的 Conventional Commits，或者 `CHANGELOG.md` 的 `Unreleased` 已有手写内容。

`pnpm release` 自身会检查当前分支、工作区和发布说明来源，但不会替你确认本地 `main` 是否落后于远程，因此 `git fetch` 和分支状态检查不能省略。若 `git pull --ff-only` 失败，应先解决分支分叉，不要先创建 release commit/tag。

这些同步命令的原因分别是：

- `git fetch origin --prune --tags` 只读取远端状态，不会合并代码；如果不先 fetch，`origin/main` 可能只是上次访问远端时留下的旧快照，ahead/behind 判断就不可靠；
- `git pull --ff-only origin main` 只允许“快进”，不会为了凑齐历史自动创建 merge commit；如果失败，通常说明本地和远端各自有新提交，需要人工判断如何整合；
- `git status --short --branch` 中出现 `ahead N` 是正常的，表示有 N 个本地提交待发布；出现 `behind N` 或 `ahead N, behind M` 时不能直接 release；
- `git log --oneline origin/main..main` 展示 `pnpm release:push` 将要推送的提交。发布前应逐条确认这些提交都属于本次发布；
- `git remote get-url origin` 用于防止把正式 release tag 推到 fork、镜像仓库或错误 remote。

### 6. 选择版本类型

版本遵循 Semantic Versioning：

| 类型 | 使用场景 | 示例 |
| --- | --- | --- |
| `patch` | 向后兼容的问题修复、小范围行为修正 | `0.1.0` → `0.1.1` |
| `minor` | 向后兼容的新功能、新增 API | `0.1.0` → `0.2.0` |
| `major` | 破坏性 API 或行为变更 | `0.1.0` → `1.0.0` |

对于 `0.x` 阶段的破坏性变更，也必须通过提交 header 的 `!`、正文中的 `BREAKING CHANGE:`，或手写 CHANGELOG 标记 `Breaking`。版本取舍有疑问时，应在执行发布命令前决定，不要在发布过程中临时修改代码。

### 7. 执行发布命令

推荐明确指定版本类型，减少交互选择错误：

```bash
pnpm release patch
# 或：pnpm release minor
# 或：pnpm release major
```

需要指定精确的自定义版本时，可以直接传入完整版本号：

```bash
pnpm release 0.2.1
```

这表示“下一版本必须是 `0.2.1`”，适合已经提前决定版本号、需要跳过交互选择或发布预发布版本的场景。传入 `patch`、`minor`、`major` 时，bumpp 会根据当前版本计算下一版本；传入完整版本号时，则直接使用该版本。两种方式都会执行同样的检查、release commit 和 tag 创建流程。

也可以使用交互式选择：

```bash
pnpm release
```

交互模式只是让 bumpp 展示候选版本供选择，不会改变后续流程。按回车确认前要看清最终版本号；确认后脚本会开始修改版本文件并执行检查。

命令内部会执行：

1. 确认当前分支必须是 `main`；
2. 确认 Git 工作区完全干净；
3. 确认最近版本 tag 后存在可生成发布说明的 Conventional Commits，或根目录 CHANGELOG 的 `Unreleased` 已有手写内容；
4. 使用 bumpp 同步更新根目录、core、playground 和 docs 的版本号；
5. 执行 `pnpm release:prepare`：
   - 如果 `Unreleased` 为空，从最近版本 tag 后的 Conventional Commits 自动生成发布说明；
   - 如果 `Unreleased` 已有内容，保留现有手写说明；
   - 将 `Unreleased` 归档为 `## <version> - <date>`；
   - 再次运行 `pnpm check`；
   - 再次运行 `pnpm check:platforms`；
6. 创建 release commit：`chore: release v<version>`；
7. 创建 tag：`v<version>`；
8. 不执行 push。

CHANGELOG 日期由脚本按 `Asia/Shanghai` 时区生成。正常情况下不要手动修改版本号、发布日期、release commit 或 tag。`pnpm release` 已经自动创建 tag，不要再手动执行 `git tag`。

### 8. 推送前人工复核

`pnpm release` 成功后，先不要立即 push。执行：

```bash
git status --short --branch
git show --stat --oneline HEAD
node -p "require('./packages/core/package.json').version"
git tag --points-at HEAD
```

必须确认：

- 工作区仍然干净；
- HEAD 是 `chore: release v<version>`；
- 根目录、core、playground 和 docs 四个 `package.json` 的版本号一致；
- CHANGELOG 已保留空的 `Unreleased`，并新增正确的版本号、日期和内容；
- HEAD 上只有一个预期的 `v<version>` tag；
- 没有把无关文件混入 release commit。

每条复核命令的作用如下：

| 命令 | 需要确认的内容 |
| --- | --- |
| `git status --short --branch` | 工作区干净，并查看本地 `main` 总共领先远端多少提交 |
| `git show --stat --oneline HEAD` | HEAD 是 release commit，且只包含 CHANGELOG 和各 workspace 版本文件 |
| `node -p "require('./packages/core/package.json').version"` | 真正发布到 npm 的 core 包版本符合预期 |
| `git tag --points-at HEAD` | 输出且只输出对应的 `v<version>` tag，证明 tag 没有指向旧提交 |

如需进一步核对本次 release commit：

```bash
git show HEAD -- CHANGELOG.md package.json packages/core/package.json playground/package.json docs/package.json
```

这里核对的是“准备发布的不可变快照”。GitHub Actions 会按 tag 检出代码，而不是按你之后的工作区状态构建，因此 tag 指向和版本文件必须在 push 前确认正确。

### 9. 一次性推送 main 和 tag

复核无误后执行：

```bash
pnpm release:push
```

它等价于：

```bash
git push origin main --follow-tags
```

该步骤会把本地尚未 push 的功能提交、release commit 和 tag 一次性推送，并真正触发远程发布。它不会重新计算或修改版本号。不要改为分别推送 main 和 tag，也不要使用 `git push --force` 或移动已经推送的 release tag。

其中：

- `git push origin main` 推送本地 `main` 上尚未上传的功能提交和 release commit；
- `--follow-tags` 会同时推送这些提交可达的 annotated tags，包括 bumpp 创建的 `v<version>` tag；
- GitHub 收到 `main` push 后会触发 CI/Docs，收到 `v*` tag 后会触发 Release workflow；
- Release workflow 按 tag 检出固定代码并发布 npm，所以 tag 一旦对外推送，就不应移动或复用。

如果 `pnpm release:push` 因网络问题失败，先检查远端状态后重试同一条命令；不要重新运行 `pnpm release`。如果失败原因是远端 `main` 已出现新提交，应先停止操作并重新核对 release tag 指向，不要直接 rebase 后继续推送旧 tag。

## 五、GitHub Actions 自动化

`pnpm release:push` 同时推送 main 的 release commit 和 tag。以下工作流按各自触发条件独立运行，不保证先后顺序。

### CI：`.github/workflows/ci.yml`

触发条件：

- push 到 `main`；
- PR 指向 `main`。

执行内容：

| Job | 内容 |
| --- | --- |
| `quality` | 使用完整 Git 历史和 tag；校验 PR 标题、PR 或 push 范围内的全部非 merge 提交；运行 `pnpm check`、微信/支付宝小程序构建、`pnpm pack:uni` |
| `cross-platform` | Windows 和 macOS 分别运行 `pnpm build`、`pnpm test` |

提交校验依赖完整历史，因此 `quality` job 的 checkout 必须保持 `fetch-depth: 0`。不要改回 shallow clone，否则无法可靠确定提交范围和最近版本 tag。

### Release：`.github/workflows/release.yml`

触发条件：

- push `v*` tag；
- 在 GitHub Actions 中手动运行，并输入已有 tag。

执行内容：

1. 检出指定 tag；
2. 校验 tag 与 `packages/core/package.json` 版本一致；
3. 从根目录 `CHANGELOG.md` 提取对应版本段落作为 GitHub Release notes；
4. 运行 `pnpm check`；
5. 构建微信和支付宝小程序；
6. 运行 `pnpm pack:npm` 和 `pnpm pack:uni`；
7. 检查该 npm 版本是否已经发布；
8. 未发布时，通过 npm Trusted Publishing 执行 `npm publish --access public --provenance`；
9. 使用提取出的 CHANGELOG 内容创建或更新 GitHub Release，并上传 npm 与 DCloud 产物。

GitHub Release 不再使用 GitHub 自动生成的 commit 列表；npm 包、文档站和 GitHub Release 都以根目录 CHANGELOG 的同一版本段落为准。对应版本段落不存在或为空时，Release workflow 会在发布 npm 前失败。

只有 `packages/core` 会发布到 npm。流水线不使用 `NPM_TOKEN`；npm Trusted Publisher 应配置为：

- Organization or user：`OFreshman`
- Repository：`uni-tree-view`
- Workflow filename：`release.yml`
- Environment name：留空

### Docs：`.github/workflows/docs.yml`

触发条件：push 到 `main`，且命中文档、组件、playground、依赖配置或 CHANGELOG 等指定路径；也支持手动运行。

正常 release commit 会修改 package 版本和 CHANGELOG，因此会触发文档构建：

```bash
pnpm docs:build
```

文档站双线部署同一份内容：**Netlify 为主入口**（`https://uni-tree-view.netlify.app/`），GitHub Pages 为备用镜像（`https://ofreshman.github.io/uni-tree-view/`，由 `docs.yml` workflow 自动部署）。

Netlify 构建应使用仓库根目录的 `netlify.toml`：

- Build command：`pnpm docs:build`
- Publish directory：`docs/.vitepress/dist`
- 环境变量：`DOCS_BASE=/`、`DOCS_SITE_URL=https://uni-tree-view.netlify.app`、`PLAYGROUND_DOCS_BASE=/ui/`

不要把 Netlify Publish directory 指到 `playground/dist/build/h5`，否则根路径会变成 playground 演示页，而不是 VitePress 文档站。

## 六、发布后验收

远程 push 后，发布尚未结束。必须完成以下验收：

### 10. 检查 GitHub Actions

确认本次提交对应的以下工作流全部成功：

- [ ] CI
- [ ] Release
- [ ] Docs

CI、Release 和 Docs 相互独立；某一个成功不代表其他工作流也成功。

### 11. 检查 npm 和 GitHub Release

```bash
npm view uni-tree-view version
npm view uni-tree-view dist-tags
```

确认：

- [ ] npm 的 `latest` 指向本次版本；
- [ ] npm 包页面显示正确的版本、README、仓库地址和 provenance；
- [ ] GitHub 上存在对应的 `v<version>` Release；
- [ ] GitHub Release 正文与根目录 `CHANGELOG.md` 的对应版本段落一致；
- [ ] GitHub Release 至少包含 npm tarball 和 DCloud 产物。

当前 DCloud 产物名称为：

| 产物 | 用途 |
| --- | --- |
| `artifacts/npm/*.tgz` | npm 包归档 |
| `artifacts/dcloud/KieranYin9527-tree.zip` | DCloud 插件包 |
| `artifacts/dcloud/KieranYin9527-tree-readme.md` | 插件说明 |
| `artifacts/dcloud/KieranYin9527-tree-example.zip` | 示例工程 |

本地 `artifacts/` 是已忽略的生成目录；正式验收以 GitHub Release 上传的产物为准。

### 12. 检查文档站

确认：

- [ ] 文档站可以访问；
- [ ] API 文档和 CHANGELOG 已更新；
- [ ] 内嵌 playground 可以加载；
- [ ] 本次新增或修改的示例行为正确。

### 13. 手动发布 DCloud 插件市场

DCloud 插件市场目前需要手动上传：

1. 打开 DCloud 插件市场发布页；
2. 下载 GitHub Release 中的 `KieranYin9527-tree.zip`；
3. 填写与 npm/Git tag 完全一致的版本号；
4. 从本次 CHANGELOG 版本段整理更新说明；
5. 按需上传 `KieranYin9527-tree-example.zip`；
6. 发布后检查插件详情页的版本、说明和示例。

- [DCloud 插件市场发布页](https://ext.dcloud.net.cn/publish)

## 七、失败处理

### 情况 A：`pnpm release` 在创建 commit 前失败

发布脚本会尝试恢复本次流程修改过的已跟踪文件。随后执行：

```bash
git status --short
git log -1 --oneline
git tag --points-at HEAD
```

确认没有意外 release commit/tag，修复测试、构建或 CHANGELOG 问题，重新提交必要修改并再次执行完整发布流程。

如果错误提示为“没有可发布的 Conventional Commits，且 `Unreleased` 为空”，先执行：

```bash
pnpm changelog:check
git log --oneline "$(git describe --tags --abbrev=0 --match 'v[0-9]*')..HEAD"
```

确认本次变更是否使用了 `feat:`、`fix:`、`perf:`、`refactor:` 或破坏性变更格式。对于尚未 push 且提交信息确实写错的本地提交，可以谨慎修正提交信息；对于已经 push 的提交不要改写历史，直接在根目录 `CHANGELOG.md` 的 `Unreleased` 手写发布说明后提交即可。

如果 `Unreleased` 已有旧的手写内容，自动生成会保留该内容并打印被跳过的提交。确认旧内容可以丢弃后，可执行：

```bash
pnpm changelog:generate --force
```

重新生成后必须人工复核并提交 `CHANGELOG.md`，再保证工作区干净后执行 `pnpm release`。如果 Git 仓库是 shallow clone，先获取完整历史和 tags；脚本会明确拒绝基于不完整历史生成发布说明。

### 情况 B：本地已创建 release commit/tag，但尚未 push

这是 `pnpm release` 成功后的正常暂停状态，本身不会造成版本混乱。先检查：

```bash
git status --short --branch
git log -1 --decorate --oneline
git tag --points-at HEAD
node -p "require('./packages/core/package.json').version"
```

如果版本、release commit 和 tag 都正确，直接继续：

```bash
pnpm release:push
```

不要再次运行 `pnpm release`，因为当前版本提交和 tag 已经生成。

如果版本选错，必须在确认 release commit/tag 从未 push、对应版本也从未发布后再撤销。建议先保留本地备份，然后删除错误 tag 并撤销最后一个 release commit，例如：

```bash
git branch backup/release-v0.2.0
git tag -d v0.2.0
git reset --hard HEAD~1
```

随后确认工作区和 CHANGELOG 状态，再重新执行正确版本的 `pnpm release`。这些命令会改写本地历史，只适用于最后一个提交确实是尚未推送的 release commit；不要删除或移动任何已经推送、已经触发工作流或已经发布到 npm 的 tag。

### 情况 C：tag 已推送，但 Release workflow 失败

优先修复工作流、Trusted Publishing 或临时服务问题，然后在 GitHub Actions 中手动运行 **Release** workflow，输入原有 tag，例如 `v0.1.1`。

该工作流会：

- 重新检出并校验已有 tag；
- 如果 npm 版本已存在，则跳过重复 publish；
- 创建或更新 GitHub Release，并覆盖上传同名产物。

不要为了重试而移动 tag、删除远程 tag 或重复创建相同版本。

### 情况 D：版本已经发布到 npm 后发现代码问题

已发布版本视为不可变：

1. 不修改原 tag；
2. 不覆盖原 npm 版本；
3. 在新提交中修复问题；
4. 使用规范的 `fix:` 提交让发布流程自动生成 CHANGELOG，或按需手写 `Unreleased`；
5. 发布新的 patch 版本。

## 八、严格执行版命令清单

以下命令同时适用于“功能提交已推送”和“功能提交仍只在本地 `main`”两种情况。后者允许本地 `main` ahead，但不能 behind 或 diverged；功能提交必须遵循 Conventional Commits，手写 CHANGELOG 时也必须已经提交：

```bash
# 1. 进入唯一允许创建正式版本的分支。
git switch main

# 2. 刷新远端分支和 tag 快照；只读取远端，不修改当前代码。
git fetch origin --prune --tags

# 3. 如果远端领先则安全快进；出现分叉时直接失败，避免自动产生 merge commit。
git pull --ff-only origin main

# 4. 核对 Node/pnpm 与仓库声明一致，避免本地和 CI 构建环境不同。
node --version
pnpm --version

# 5. 确认工作区干净。ahead 可以接受，behind/diverged 不能继续。
git status --short --branch

# 6. 查看尚未 push 的提交；这些提交稍后都会随 release 一起推送。
git log --oneline origin/main..main

# 7. 确认不会把正式 tag 推到错误仓库。
git remote get-url origin

# 8. 严格按 lockfile 安装依赖，避免发布前悄悄改依赖解析结果。
pnpm install --frozen-lockfile

# 9. 先验证代码、类型、测试、H5 和小程序构建；失败时此刻还没有创建版本提交/tag。
pnpm changelog:check
pnpm check
pnpm check:platforms

# 10. 选择一种版本方式。命令会再次检查，并自动创建 release commit 和 tag，但不会 push。
pnpm release patch
# pnpm release minor
# pnpm release major
# pnpm release 0.2.1  # 精确指定版本
# pnpm release        # 交互选择版本

# 11. 确认 release 后工作区仍干净，并查看 HEAD 是否为预期的 release commit。
git status --short --branch
git show --stat --oneline HEAD

# 12. 核对真正发布到 npm 的 core 包版本，以及 tag 是否准确指向 HEAD。
node -p "require('./packages/core/package.json').version"
git tag --points-at HEAD

# 13. 最终确认无误后，一次性推送 main 和 annotated tag；这一刻才会触发远端发布。
pnpm release:push

# 14. GitHub Actions 成功后，检查 npm 当前版本和 latest 等 dist-tag。
npm view uni-tree-view version
npm view uni-tree-view dist-tags
```

## 九、禁止事项

- 不在 `main` 以外的分支执行 `pnpm release`；
- 不在工作区有未提交改动时执行发布；
- 不手动修改多个 `package.json` 的版本号；
- 不在 `pnpm release` 成功后重复运行 `pnpm release`；
- 不在 `pnpm release` 已自动创建 tag 后再次手动执行 `git tag`；
- 不手动编辑 `packages/core/CHANGELOG.md`；
- 不在不了解其会修改根目录 CHANGELOG、导致工作区变脏的情况下单独运行 `pnpm changelog`；
- 不在本地直接执行 `npm publish`；
- 不省略 release commit/tag 的人工复核；
- 不分别随意推送 main 和 release tag；
- 不移动、覆盖或强推已经发布的 tag；
- 不使用 `git push --force`；
- 不因工作流失败而复用版本号重新打 tag；
- 未确认 npm、GitHub Release、Docs 和 DCloud 状态前，不视为发布完成。
