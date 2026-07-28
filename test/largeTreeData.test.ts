import { describe, expect, it } from "vitest";
import type { LargeTreeNode } from "../playground/src/utils/largeTreeData";
import { createLargeTreeData, LARGE_TREE_DEFAULTS } from "../playground/src/utils/largeTreeData";

function inspectTree(data: LargeTreeNode[]) {
  const keys = new Set<string>();
  const leafDepths = new Set<number>();
  let count = 0;
  let maxDepth = 0;

  function visit(nodes: LargeTreeNode[], depth: number) {
    for (const node of nodes) {
      count += 1;
      maxDepth = Math.max(maxDepth, depth);
      keys.add(node.id);

      if (node.children?.length) {
        visit(node.children, depth + 1);
      } else {
        leafDepths.add(depth);
      }
    }
  }

  visit(data, 1);
  return { count, keys, leafDepths, maxDepth };
}

describe("createLargeTreeData", () => {
  it("creates a deterministic 12,000-node tree with irregular 2-6 level branches", () => {
    const first = createLargeTreeData();
    const second = createLargeTreeData();
    const inspected = inspectTree(first.data);

    expect(first.count).toBe(LARGE_TREE_DEFAULTS.total);
    expect(inspected.count).toBe(LARGE_TREE_DEFAULTS.total);
    expect(inspected.keys.size).toBe(LARGE_TREE_DEFAULTS.total);
    expect(inspected.maxDepth).toBe(LARGE_TREE_DEFAULTS.maxDepth);
    expect([...inspected.leafDepths].sort()).toEqual([2, 3, 4, 5, 6]);
    expect(Math.min(...inspected.leafDepths)).toBe(LARGE_TREE_DEFAULTS.minDepth);
    expect(Math.max(...inspected.leafDepths)).toBe(LARGE_TREE_DEFAULTS.maxDepth);
    expect(inspected.keys.has(first.targetKey)).toBe(true);
    expect(second.data).toEqual(first.data);
    expect(second.targetKey).toBe(first.targetKey);
  });
});