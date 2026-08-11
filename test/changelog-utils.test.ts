import { describe, expect, it } from "vitest";
import {
  assertChangelogCanBePrepared,
  assertValidCommitSubject,
  createChangelogPreparation,
  createPackageChangelog,
  extractReleaseNotes,
  formatReleaseDate,
  generateUnreleasedContent,
  getUnreleasedContent,
  parseConventionalCommit,
  promoteUnreleased,
  replaceUnreleasedContent,
  resolveChangelogGeneration
} from "../scripts/changelog-utils";

describe("createPackageChangelog", () => {
  it("marks the package changelog as generated and copies the root changelog", () => {
    expect(createPackageChangelog("# Changelog\r\n\r\n## Unreleased\r\n")).toBe(
      "<!-- 此文件由仓库根目录 CHANGELOG.md 自动生成，请勿直接编辑。 -->\n\n# Changelog\n\n## Unreleased\n"
    );
  });
});

describe("assertValidCommitSubject", () => {
  it.each([
    "feat: 增加拖拽能力",
    "fix(tree): 修复禁用节点状态",
    "refactor(core)!: 移除旧属性",
    "✨ feat: 更新虚拟渲染说明",
    "chore: release v0.3.2"
  ])("accepts Conventional Commit subject %s", (subject) => {
    expect(() => assertValidCommitSubject(subject)).not.toThrow();
  });

  it.each([
    "update: dependencies",
    "修复禁用节点状态",
    "Fix: uppercase type",
    "fix(tree):"
  ])("rejects invalid commit subject %s", (subject) => {
    expect(() => assertValidCommitSubject(subject)).toThrow("Invalid commit subject");
  });

  it("allows generated merge subjects only when explicitly enabled", () => {
    expect(() => assertValidCommitSubject("Merge pull request #12 from feature/tree"))
      .toThrow("Invalid commit subject");
    expect(() => assertValidCommitSubject("Merge pull request #12 from feature/tree", {
      allowMerge: true
    })).not.toThrow();
  });
});

describe("parseConventionalCommit", () => {
  it("parses scopes and keeps Chinese descriptions", () => {
    expect(parseConventionalCommit({
      subject: "fix(docs): 修复 GitHub Pages 示例预览 404"
    })).toEqual({
      breaking: false,
      description: "修复 GitHub Pages 示例预览 404。",
      scope: "docs",
      section: "Fixed"
    });
  });

  it("parses an optional emoji prefix", () => {
    expect(parseConventionalCommit({
      subject: "✨ feat(docs): 更新虚拟渲染说明"
    })).toEqual({
      breaking: false,
      description: "更新虚拟渲染说明。",
      scope: "docs",
      section: "Added"
    });
  });

  it("recognizes breaking markers and breaking change footers", () => {
    expect(parseConventionalCommit({
      subject: "feat(tree)!: 移除旧选择属性"
    })).toEqual({
      breaking: true,
      description: "移除旧选择属性。",
      scope: "tree",
      section: "Changed"
    });

    expect(parseConventionalCommit({
      body: "BREAKING CHANGE: selection events now use a unified payload",
      subject: "chore: clean up legacy aliases"
    })).toEqual({
      breaking: true,
      description: "selection events now use a unified payload.",
      scope: undefined,
      section: "Changed"
    });
  });

  it.each([
    "build: update build output",
    "chore: update dependencies",
    "ci: update release workflow",
    "docs: update README",
    "style: format source files",
    "test: add component coverage",
    "not a conventional commit"
  ])("ignores non-releasable commit %s", (subject) => {
    expect(parseConventionalCommit({ subject })).toBeUndefined();
  });
});

describe("generateUnreleasedContent", () => {
  it("groups releasable commits in a stable section order", () => {
    expect(generateUnreleasedContent([
      { subject: "fix: 修复预览 404" },
      { subject: "refactor(core): simplify tree state" },
      { subject: "feat: 支持节点拖拽" },
      { subject: "perf: reduce repeated traversal" }
    ])).toBe(`### Added

- 支持节点拖拽。

### Changed

- **core:** simplify tree state.
- reduce repeated traversal.

### Fixed

- 修复预览 404。`);
  });

  it("is idempotent by removing duplicate generated entries", () => {
    expect(generateUnreleasedContent([
      { subject: "fix: 修复预览 404" },
      { subject: "fix: 修复预览 404" }
    ])).toBe(`### Fixed

- 修复预览 404。`);
  });

  it("returns empty content when there are no releasable commits", () => {
    expect(generateUnreleasedContent([
      { subject: "test: add release tests" },
      { subject: "chore: update tooling" }
    ])).toBe("");
  });
});

describe("changelog generation preparation", () => {
  const emptySource = "# Changelog\n\n## Unreleased\n\n## 0.3.1 - 2026-08-01\n";
  const manualSource = "# Changelog\n\n## Unreleased\n\n### Fixed\n\n- Manual note.\n\n## 0.3.1 - 2026-08-01\n";
  const commits = [{ subject: "fix: 修复预览 404" }];

  it("uses one preparation result for validation and generation", () => {
    const preparation = createChangelogPreparation(emptySource, commits, "v0.3.1");

    expect(preparation).toEqual({
      commitRangeDescription: "since v0.3.1",
      existingContent: "",
      generatedContent: "### Fixed\n\n- 修复预览 404。"
    });
    expect(() => assertChangelogCanBePrepared(preparation)).not.toThrow();
    expect(resolveChangelogGeneration(preparation)).toEqual({
      action: "replace",
      content: "### Fixed\n\n- 修复预览 404。"
    });
  });

  it("keeps manual notes and exposes skipped automatic entries", () => {
    const preparation = createChangelogPreparation(manualSource, commits, "v0.3.1");

    expect(resolveChangelogGeneration(preparation)).toEqual({
      action: "keep",
      skippedContent: "### Fixed\n\n- 修复预览 404。"
    });
  });

  it("replaces manual notes when forced", () => {
    const preparation = createChangelogPreparation(manualSource, commits, "v0.3.1");

    expect(resolveChangelogGeneration(preparation, true)).toEqual({
      action: "replace",
      content: "### Fixed\n\n- 修复预览 404。"
    });
  });

  it("rejects missing release notes with the shared message", () => {
    const preparation = createChangelogPreparation(emptySource, [
      { subject: "docs: update README" }
    ], "v0.3.1");

    expect(() => assertChangelogCanBePrepared(preparation))
      .toThrow("No releasable Conventional Commits found since v0.3.1");
    expect(() => resolveChangelogGeneration(preparation))
      .toThrow("No releasable Conventional Commits found since v0.3.1");
  });

  it("does not erase manual notes when force has no generated entries", () => {
    const preparation = createChangelogPreparation(manualSource, [
      { subject: "docs: update README" }
    ], "v0.3.1");

    expect(() => resolveChangelogGeneration(preparation, true))
      .toThrow("cannot replace existing Unreleased notes with empty content");
  });

  it("rejects a changelog without an Unreleased section", () => {
    expect(() => createChangelogPreparation("# Changelog\n", commits, "v0.3.1"))
      .toThrow("Missing `## Unreleased` section");
  });
});

describe("replaceUnreleasedContent", () => {
  it("replaces only Unreleased and preserves existing releases", () => {
    const source = `# Changelog\n\n## Unreleased\n\n### Fixed\n\n- Old generated note.\n\n## 0.3.1 - 2026-08-01\n\n- Previous release.\n`;
    const content = `### Added\n\n- New feature.`;
    const expected = `# Changelog\n\n## Unreleased\n\n### Added\n\n- New feature.\n\n## 0.3.1 - 2026-08-01\n\n- Previous release.\n`;

    expect(replaceUnreleasedContent(source, content)).toBe(expected);
    expect(replaceUnreleasedContent(expected, content)).toBe(expected);
    expect(getUnreleasedContent(expected)).toBe(content);
  });
});

describe("extractReleaseNotes", () => {
  const source = `# Changelog

## Unreleased

## 0.3.2 - 2026-08-04

### Added

- New feature.

### Fixed

- Release fix.

## 0.3.1 - 2026-08-01

- Previous release.
`;

  it("extracts only the requested release body", () => {
    expect(extractReleaseNotes(source, "0.3.2")).toBe(`### Added

- New feature.

### Fixed

- Release fix.`);
  });

  it("rejects missing or empty release sections", () => {
    expect(() => extractReleaseNotes(source, "0.4.0"))
      .toThrow("Version 0.4.0 does not exist");
    expect(() => extractReleaseNotes(
      "# Changelog\n\n## Unreleased\n\n## 0.3.2 - 2026-08-04\n",
      "0.3.2"
    )).toThrow("Version 0.3.2 has no release notes");
  });
});

describe("promoteUnreleased", () => {
  it("moves unreleased entries under the release heading", () => {
    const source = `# Changelog\n\n## Unreleased\n\n### Added\n\n- New feature.\n\n## 0.0.7 - 2025-12-17\n`;

    expect(promoteUnreleased(source, {
      date: "2026-07-28",
      version: "0.0.8"
    })).toBe(`# Changelog\n\n## Unreleased\n\n## 0.0.8 - 2026-07-28\n\n### Added\n\n- New feature.\n\n## 0.0.7 - 2025-12-17\n`);
  });

  it("rejects an empty unreleased section", () => {
    const source = `# Changelog\n\n## Unreleased\n\n## 0.0.7 - 2025-12-17\n`;

    expect(() => promoteUnreleased(source, {
      date: "2026-07-28",
      version: "0.0.8"
    })).toThrow("Add release notes before running `pnpm release`");
  });

  it("rejects a duplicate release version", () => {
    const source = `# Changelog\n\n## Unreleased\n\n- New feature.\n\n## 0.0.8 - 2026-07-28\n`;

    expect(() => promoteUnreleased(source, {
      date: "2026-07-28",
      version: "0.0.8"
    })).toThrow("Version 0.0.8 already exists");
  });
});

describe("formatReleaseDate", () => {
  it("formats dates in the project timezone", () => {
    expect(formatReleaseDate(new Date("2026-07-27T16:30:00.000Z"))).toBe("2026-07-28");
  });
});