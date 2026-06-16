import { describe, expect, it } from "vitest";
import { UniTreeListResolver, UniTreeViewResolver } from "../packages/core/resolver";

describe("uni-tree-view resolver", () => {
  it("resolves the recommended component name", () => {
    const resolver = UniTreeViewResolver();

    expect(resolver.resolve("UniTreeView")).toEqual({
      name: "UniTreeView",
      from: "uni-tree-view"
    });
  });

  it("keeps the legacy UniTreeList component name compatible", () => {
    const resolver = UniTreeListResolver();

    expect(resolver.resolve("UniTreeList")).toEqual({
      name: "UniTreeList",
      from: "uni-tree-view"
    });
  });

  it("honors exclude rules", () => {
    const resolver = UniTreeViewResolver({
      exclude: /^UniTree/
    });

    expect(resolver.resolve("UniTreeView")).toBeUndefined();
  });
});