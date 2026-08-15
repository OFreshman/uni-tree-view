import { describe, expect, it } from "vitest";
import { replaceExactlyOnce } from "../packages/core/scripts/replace-exactly-once";

describe("replaceExactlyOnce", () => {
  it("replaces one expected occurrence", () => {
    expect(replaceExactlyOnce("before target after", "target", "replacement", "test target"))
      .toBe("before replacement after");
  });

  it("rejects a missing occurrence", () => {
    expect(() => replaceExactlyOnce("before after", "target", "replacement", "test target"))
      .toThrow("0 matches");
  });

  it("rejects duplicate occurrences", () => {
    expect(() => replaceExactlyOnce("target and target", "target", "replacement", "test target"))
      .toThrow("2 matches");
  });
});