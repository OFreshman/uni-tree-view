// @env node

export interface PromoteUnreleasedOptions {
  date: string;
  version: string;
}

interface UnreleasedSection {
  content: string;
  contentStart: number;
  normalizedSource: string;
}

const PackageChangelogNotice = "<!-- 此文件由仓库根目录 CHANGELOG.md 自动生成，请勿直接编辑。 -->";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseUnreleasedSection(source: string): UnreleasedSection {
  const normalizedSource = source.replace(/\r\n/g, "\n");
  const unreleasedHeading = /^## Unreleased[^\S\n]*$/m.exec(normalizedSource);

  if (!unreleasedHeading) {
    throw new Error("Missing `## Unreleased` section");
  }

  const contentStart = unreleasedHeading.index + unreleasedHeading[0].length;
  const remainingSource = normalizedSource.slice(contentStart);
  const nextHeadingOffset = remainingSource.search(/\n## /);
  const contentEnd = nextHeadingOffset === -1
    ? normalizedSource.length
    : contentStart + nextHeadingOffset;

  return {
    content: normalizedSource.slice(contentStart, contentEnd).trim(),
    contentStart,
    normalizedSource
  };
}

export function formatReleaseDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function createPackageChangelog(source: string): string {
  const normalizedSource = source.replace(/\r\n/g, "\n").trim();

  return `${PackageChangelogNotice}\n\n${normalizedSource}\n`;
}

function assertUnreleasedSectionHasContent(section: UnreleasedSection): void {
  if (!section.content) {
    throw new Error("The `## Unreleased` section is empty. Add release notes before running `pnpm release`.");
  }
}

export function assertUnreleasedHasContent(source: string): void {
  assertUnreleasedSectionHasContent(parseUnreleasedSection(source));
}

export function promoteUnreleased(
  source: string,
  options: PromoteUnreleasedOptions
): string {
  const section = parseUnreleasedSection(source);
  const versionPattern = new RegExp(`^## ${escapeRegExp(options.version)}(?:\\s|$)`, "m");
  if (versionPattern.test(section.normalizedSource)) {
    throw new Error(`Version ${options.version} already exists`);
  }

  assertUnreleasedSectionHasContent(section);

  const releaseHeading = `## ${options.version} - ${options.date}`;

  return `${section.normalizedSource.slice(0, section.contentStart)}\n\n${releaseHeading}${section.normalizedSource.slice(section.contentStart)}`;
}