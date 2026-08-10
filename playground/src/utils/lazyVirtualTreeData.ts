import type { TreeDataItem, TreeKey, TreeNode } from "uni-tree-view";

export const VIRTUAL_LAZY_ROOT_COUNT = 80;
export const VIRTUAL_LAZY_CHILD_COUNT = 16;
export const VIRTUAL_LAZY_FAILURE_KEY = "lazy-region-1";

export function createVirtualLazyRootData(): TreeDataItem[] {
  return Array.from({ length: VIRTUAL_LAZY_ROOT_COUNT }, (_, index) => ({
    id: `lazy-region-${index + 1}`,
    label: `异步区域 ${index + 1}`,
    append: `${VIRTUAL_LAZY_CHILD_COUNT} 个网点`,
    leaf: false
  }));
}

export function createVirtualLazyLoader(options: {
  delay?: number;
  failFirstKey?: TreeKey | false;
} = {}) {
  const delay = options.delay ?? 240;
  const failFirstKey = options.failFirstKey ?? VIRTUAL_LAZY_FAILURE_KEY;
  const attempts = new Map<TreeKey, number>();

  async function load(node: TreeNode): Promise<TreeDataItem[]> {
    await wait(delay);
    const attempt = (attempts.get(node.id) ?? 0) + 1;
    attempts.set(node.id, attempt);

    if (failFirstKey !== false && node.id === failFirstKey && attempt === 1) {
      throw new Error(`${node.label} 模拟首次加载失败`);
    }

    return Array.from({ length: VIRTUAL_LAZY_CHILD_COUNT }, (_, index) => ({
      id: `${String(node.id)}-site-${index + 1}`,
      label: `${node.label} · 网点 ${index + 1}`,
      leaf: true
    }));
  }

  return { attempts, load };
}

function wait(delay: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delay));
}