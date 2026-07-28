export interface LargeTreeNode {
  id: string;
  label: string;
  children?: LargeTreeNode[];
}

export interface LargeTreeDataOptions {
  total?: number;
  seed?: number;
}

export interface LargeTreeDataResult {
  data: LargeTreeNode[];
  count: number;
  minDepth: number;
  maxDepth: number;
  targetKey: string;
  targetLabel: string;
}

export const LARGE_TREE_DEFAULTS = {
  total: 12_000,
  seed: 20_260_728,
  minDepth: 2,
  maxDepth: 6
} as const;

const ROOT_COUNT = 18;
const LEVEL_NAMES = ["区域", "城市", "片区", "街道", "社区", "网格"];

interface TreeBranch {
  node: LargeTreeNode;
  depth: number;
  path: string;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function randomInteger(random: () => number, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function takeBranch(branches: TreeBranch[], index: number) {
  const branch = branches[index];
  const lastBranch = branches[branches.length - 1];

  if (!branch || !lastBranch) {
    throw new Error("Unable to select a large-tree branch");
  }

  branches.pop();

  if (index < branches.length) {
    branches[index] = lastBranch;
  }

  return branch;
}

export function createLargeTreeData(options: LargeTreeDataOptions = {}): LargeTreeDataResult {
  const total = options.total ?? LARGE_TREE_DEFAULTS.total;
  const seed = options.seed ?? LARGE_TREE_DEFAULTS.seed;

  if (!Number.isInteger(total) || total < 1_000) {
    throw new Error("Large-tree total must be an integer greater than or equal to 1,000");
  }

  const random = createSeededRandom(seed);
  const data: LargeTreeNode[] = [];
  const expandableBranches: TreeBranch[] = [];
  let count = 0;

  function createNode(depth: number, path: string): TreeBranch {
    count += 1;

    return {
      depth,
      path,
      node: {
        id: `area-${path}`,
        label: `${LEVEL_NAMES[depth - 1]} ${path}`
      }
    };
  }

  function appendChildren(parent: TreeBranch, childCount: number) {
    const childDepth = parent.depth + 1;
    const children = Array.from({ length: childCount }, (_, index) => {
      return createNode(childDepth, `${parent.path}-${index + 1}`);
    });

    parent.node.children = children.map((child) => child.node);

    if (childDepth < LARGE_TREE_DEFAULTS.maxDepth) {
      expandableBranches.push(...children);
    }

    return children;
  }

  for (let rootIndex = 0; rootIndex < ROOT_COUNT; rootIndex += 1) {
    const root = createNode(1, String(rootIndex + 1));
    data.push(root.node);
    appendChildren(root, randomInteger(random, 3, 5));
  }

  let targetBranch = expandableBranches[0];

  if (!targetBranch) {
    throw new Error("Unable to create the large-tree target branch");
  }

  while (targetBranch.depth < LARGE_TREE_DEFAULTS.maxDepth) {
    const targetIndex = expandableBranches.indexOf(targetBranch);
    takeBranch(expandableBranches, targetIndex);
    [targetBranch] = appendChildren(targetBranch, randomInteger(random, 2, 4));
  }

  while (true) {
    if (count >= total) {
      break;
    }

    if (!expandableBranches.length) {
      throw new Error(`Unable to generate ${total} nodes within ${LARGE_TREE_DEFAULTS.maxDepth} levels`);
    }

    const branchIndex = randomInteger(random, 0, expandableBranches.length - 1);
    const branch = takeBranch(expandableBranches, branchIndex);
    const remaining = total - count;
    const childCount = Math.min(randomInteger(random, 2, 7), remaining);
    appendChildren(branch, childCount);
  }

  return {
    data,
    count,
    minDepth: LARGE_TREE_DEFAULTS.minDepth,
    maxDepth: LARGE_TREE_DEFAULTS.maxDepth,
    targetKey: targetBranch.node.id,
    targetLabel: targetBranch.node.label
  };
}