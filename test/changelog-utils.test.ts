import { describe, expect, it } from "vitest";
import { formatReleaseDate, promoteUnreleased } from "../scripts/changelog-utils";

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
    })).toThrow("The `## Unreleased` section is empty");
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