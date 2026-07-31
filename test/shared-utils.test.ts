import { describe, expect, it, vi } from "vitest";
import { defaultTo, isEmpty, lowerFirst, upperFirst } from "../packages/core/src/utils/helpers";
import { mitt } from "../packages/core/src/utils/mitt";

describe("shared utilities", () => {
  it("keeps helper behavior stable", () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({ value: 1 })).toBe(false);
    expect(defaultTo(Number.NaN, undefined, "fallback")).toBe("fallback");
    expect(upperFirst("tree")).toBe("Tree");
    expect(lowerFirst("Tree")).toBe("tree");
  });

  it("passes the event type and payload to wildcard mitt handlers", () => {
    const emitter = mitt<{ change: { value: number } }>();
    const directHandler = vi.fn();
    const wildcardHandler = vi.fn();

    emitter.on("change", directHandler);
    emitter.on("*", wildcardHandler);
    emitter.emit("change", { value: 1 });

    expect(directHandler).toHaveBeenCalledWith({ value: 1 });
    expect(wildcardHandler).toHaveBeenCalledWith("change", { value: 1 });
  });
});