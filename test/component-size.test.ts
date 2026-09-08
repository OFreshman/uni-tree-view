import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { assertComponentSize, componentIncrement, ComponentSizeBudgets, measureOutput } from "../scripts/check-component-size";

describe("final component size measurement", () => {
  it("includes runtime resources, but excludes source maps and devtools configuration", () => {
    const output = measureOutput([
      { path: "common/vendor.js", contents: Buffer.from("runtime") },
      { path: "component.wxss", contents: Buffer.from("style") },
      { path: "component.wxml", contents: Buffer.from("template") },
      { path: "font.woff", contents: Buffer.from([1, 2, 3]) },
      { path: "app.json", contents: Buffer.from("{}") },
      { path: "app.js.map", contents: Buffer.from("source map") },
      { path: "project.config.json", contents: Buffer.from("devtools") },
      { path: "project.private.config.json", contents: Buffer.from("local settings") }
    ]);
    expect(output.files).toBe(5);
    expect(output.rawBytes).toBe(25);
    expect(output.gzipBytes).toBeGreaterThan(0);
  });

  it("counts component logic emitted inside a shared vendor file", () => {
    const baseline = measureOutput([{ path: "vendor.js", contents: Buffer.from("framework") }]);
    const withComponent = measureOutput([
      { path: "vendor.js", contents: Buffer.from("framework and component state") },
      { path: "component.css", contents: Buffer.from(".tree { color: red; }") }
    ]);
    const increment = componentIncrement(baseline, withComponent);
    expect(increment.rawBytes).toBe(withComponent.rawBytes - baseline.rawBytes);
    expect(increment.files).toBe(1);
    expect(increment.gzipBytes).toBeGreaterThan(0);
  });

  it("fails instead of reporting zero when the component was not actually bundled", () => {
    const output = { files: 1, rawBytes: 100, gzipBytes: 50 };
    expect(() => componentIncrement(output, output)).toThrow("larger component");
    expect(() => componentIncrement({ files: 0, rawBytes: 0, gzipBytes: 0 }, output)).toThrow("non-empty baseline");
  });

  it.each(["h5", "mp-weixin", "mp-alipay"] as const)("enforces the %s raw-output budget", (platform) => {
    const budget = ComponentSizeBudgets[platform];
    const atLimit = { files: 1, rawBytes: budget.rawBytes, gzipBytes: budget.gzipBytes ?? 1 };
    expect(() => assertComponentSize(platform, atLimit)).not.toThrow();
    expect(() => assertComponentSize(platform, { ...atLimit, rawBytes: atLimit.rawBytes + 1 })).toThrow("budget");
  });

  it("also bounds the H5 compressed transfer increment", () => {
    expect(() => assertComponentSize("h5", {
      files: 1,
      rawBytes: 1,
      gzipBytes: (ComponentSizeBudgets.h5.gzipBytes ?? 0) + 1
    })).toThrow("budget");
  });
});