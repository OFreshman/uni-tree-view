// @env node

export interface PromoteUnreleasedOptions {
  date: string;
  version: string;
}

export interface ConventionalCommit {
  body?: string;
  hash?: string;
  subject: string;
}

export interface ChangelogPreparation {
  commitRangeDescription: string;
  existingContent: string;
  generatedContent: string;
}

export type ChangelogGenerationDecision =
  | {
    action: "keep";
    skippedContent: string;
  }
  | {
    action: "replace";
    content: string;
  };

export interface ValidateCommitSubjectOptions {
  allowMerge?: boolean;
}

export type ChangelogSection = "Added" | "Changed" | "Fixed";

export interface ChangelogEntry {
  breaking: boolean;
  description: string;
  scope?: string;
  section: ChangelogSection;
}

interface UnreleasedSection {
  content: string;
  contentStart: number;
  normalizedSource: string;
}

const PackageChangelogNotice = "<!-- 此文件由仓库根目录 CHANGELOG.md 自动生成，请勿直接编辑。 -->";
const ChangelogSectionOrder: ChangelogSection[] = ["Added", "Changed", "Fixed"];
const CommitTypeSections: Record<string, ChangelogSection | undefined> = {
  feat: "Added",
  fix: "Fixed",
  perf: "Changed",
  refactor: "Changed"
};
const AllowedCommitTypes = [
  "build",
  "chore",
  "ci",
  "docs",
  "feat",
  "fix",
  "perf",
  "refactor",
  "revert",
  "style",
  "test"
] as const;
const ConventionalCommitSubjectPattern = new RegExp(
  `^(?:${AllowedCommitTypes.join("|")})(?:\\([^()\\s]+\\))?!?: \\S.*$`
);

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

export function getUnreleasedContent(source: string): string {
  return parseUnreleasedSection(source).content;
}

function assertUnreleasedSectionHasContent(section: UnreleasedSection): void {
  if (!section.content) {
    throw new Error("The `## Unreleased` section is empty. Add release notes before running `pnpm release`.");
  }
}

export function assertValidCommitSubject(
  subject: string,
  options: ValidateCommitSubjectOptions = {}
): void {
  const normalizedSubject = subject.trim();
  if (options.allowMerge && normalizedSubject.startsWith("Merge ")) {
    return;
  }

  if (ConventionalCommitSubjectPattern.test(normalizedSubject)) {
    return;
  }

  throw new Error(
    `Invalid commit subject: ${JSON.stringify(normalizedSubject)}. `
    + "Use `<type>(<scope>)!: <description>` with one of: "
    + `${AllowedCommitTypes.join(", ")}.`
  );
}

function extractBreakingDescription(body: string): string | undefined {
  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
    const normalizedLine = line.trim();
    const upperLine = normalizedLine.toUpperCase();
    const prefix = ["BREAKING CHANGE:", "BREAKING-CHANGE:"]
      .find((candidate) => upperLine.startsWith(candidate));
    if (prefix) {
      return normalizedLine.slice(prefix.length).trim() || undefined;
    }
  }

  return undefined;
}

function punctuateDescription(description: string): string {
  const normalizedDescription = description.trim();
  if (!normalizedDescription || /[.!?。！？]$/.test(normalizedDescription)) {
    return normalizedDescription;
  }

  return `${normalizedDescription}${/[\u3400-\u9FFF]/.test(normalizedDescription) ? "。" : "."}`;
}

export function parseConventionalCommit(commit: ConventionalCommit): ChangelogEntry | undefined {
  const subject = commit.subject.trim();
  const separatorIndex = subject.indexOf(":");
  if (separatorIndex === -1) {
    return undefined;
  }

  const header = subject.slice(0, separatorIndex);
  const description = subject.slice(separatorIndex + 1).trim();
  if (!description) {
    return undefined;
  }

  const match = /^(?<type>[a-z]+)(?:\((?<scope>[^)\r\n]+)\))?(?<breaking>!)?$/i.exec(header);
  if (!match?.groups) {
    return undefined;
  }

  const type = match.groups.type.toLowerCase();
  const breakingDescription = extractBreakingDescription(commit.body || "");
  const breaking = Boolean(match.groups.breaking || breakingDescription);
  const section = breaking ? "Changed" : CommitTypeSections[type];
  if (!section) {
    return undefined;
  }

  return {
    breaking,
    description: punctuateDescription(breakingDescription || description),
    scope: match.groups.scope?.trim() || undefined,
    section
  };
}

function formatChangelogEntry(entry: ChangelogEntry): string {
  const scopedDescription = entry.scope
    ? `**${entry.scope}:** ${entry.description}`
    : entry.description;

  return `- ${entry.breaking ? `**Breaking:** ${scopedDescription}` : scopedDescription}`;
}

export function generateUnreleasedContent(commits: ConventionalCommit[]): string {
  const entriesBySection = new Map<ChangelogSection, ChangelogEntry[]>();
  const seenEntries = new Set<string>();

  for (const commit of commits) {
    const entry = parseConventionalCommit(commit);
    if (!entry) {
      continue;
    }

    const entryKey = [entry.section, entry.breaking, entry.scope, entry.description].join("\0");
    if (seenEntries.has(entryKey)) {
      continue;
    }

    seenEntries.add(entryKey);
    const sectionEntries = entriesBySection.get(entry.section) || [];
    sectionEntries.push(entry);
    entriesBySection.set(entry.section, sectionEntries);
  }

  return ChangelogSectionOrder.flatMap((section) => {
    const entries = entriesBySection.get(section);
    if (!entries?.length) {
      return [];
    }

    return [`### ${section}\n\n${entries.map(formatChangelogEntry).join("\n")}`];
  }).join("\n\n");
}

export function createChangelogPreparation(
  source: string,
  commits: ConventionalCommit[],
  latestTag?: string
): ChangelogPreparation {
  return {
    commitRangeDescription: latestTag ? `since ${latestTag}` : "from repository history",
    existingContent: getUnreleasedContent(source),
    generatedContent: generateUnreleasedContent(commits)
  };
}

export function assertChangelogCanBePrepared(preparation: ChangelogPreparation): void {
  if (preparation.generatedContent || preparation.existingContent) {
    return;
  }

  throw new Error(
    `No releasable Conventional Commits found ${preparation.commitRangeDescription}, `
    + "and the `## Unreleased` section is empty. "
    + "Use feat:, fix:, perf:, or refactor:, or add release notes manually."
  );
}

export function resolveChangelogGeneration(
  preparation: ChangelogPreparation,
  force = false
): ChangelogGenerationDecision {
  assertChangelogCanBePrepared(preparation);

  if (preparation.existingContent && !force) {
    return {
      action: "keep",
      skippedContent: preparation.generatedContent
    };
  }

  if (!preparation.generatedContent) {
    throw new Error(
      `No releasable Conventional Commits found ${preparation.commitRangeDescription}; `
      + "`--force` cannot replace existing Unreleased notes with empty content."
    );
  }

  return {
    action: "replace",
    content: preparation.generatedContent
  };
}

export function replaceUnreleasedContent(source: string, content: string): string {
  const section = parseUnreleasedSection(source);
  const normalizedContent = content.trim();
  const replacement = normalizedContent ? `\n\n${normalizedContent}\n` : "\n";

  const remainingSource = section.normalizedSource.slice(section.contentStart);
  const nextHeadingOffset = remainingSource.search(/\n## /);
  const contentEnd = nextHeadingOffset === -1
    ? section.normalizedSource.length
    : section.contentStart + nextHeadingOffset;

  return `${section.normalizedSource.slice(0, section.contentStart)}${replacement}${section.normalizedSource.slice(contentEnd)}`;
}

export function extractReleaseNotes(source: string, version: string): string {
  const normalizedSource = source.replace(/\r\n/g, "\n");
  const releaseHeading = new RegExp(
    `^## ${escapeRegExp(version)}(?:\\s+-\\s+[^\\n]+)?[^\\S\\n]*$`,
    "m"
  ).exec(normalizedSource);

  if (!releaseHeading) {
    throw new Error(`Version ${version} does not exist in CHANGELOG.md`);
  }

  const contentStart = releaseHeading.index + releaseHeading[0].length;
  const remainingSource = normalizedSource.slice(contentStart);
  const nextHeadingOffset = remainingSource.search(/\n## /);
  const contentEnd = nextHeadingOffset === -1
    ? normalizedSource.length
    : contentStart + nextHeadingOffset;
  const content = normalizedSource.slice(contentStart, contentEnd).trim();

  if (!content) {
    throw new Error(`Version ${version} has no release notes in CHANGELOG.md`);
  }

  return content;
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