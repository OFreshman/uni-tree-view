export const demoSceneKeys = [
  "basic",
  "selection",
  "filter",
  "lazy-load",
  "virtual",
  "slots"
] as const;

export type DemoScene = typeof demoSceneKeys[number];

export interface DemoSceneMeta {
  index: string;
  title: string;
  description: string;
  eyebrow: string;
  tags: string[];
}

export const demoSceneMeta: Record<DemoScene, DemoSceneMeta> = {
  basic: {
    index: "01",
    title: "基础交互",
    description: "展开节点、切换整行点击，并按需显示完整层级路径。",
    eyebrow: "EXPAND & PATH",
    tags: ["展开收起", "节点路径"]
  },
  selection: {
    index: "02",
    title: "选择策略",
    description: "在单选、叶子单选、父子联动和严格模式之间切换，也可通过 ref 方法操作选中。",
    eyebrow: "SELECTION",
    tags: ["v-model", "半选状态", "ref 方法"]
  },
  filter: {
    index: "03",
    title: "搜索过滤",
    description: "输入关键词快速定位节点，自动保留命中节点的祖先路径。",
    eyebrow: "FILTER",
    tags: ["关键词高亮", "空状态"]
  },
  "lazy-load": {
    index: "04",
    title: "按需加载",
    description: "展开区域节点时异步获取下一层数据，可模拟首次加载失败并重试。",
    eyebrow: "ASYNC LOAD",
    tags: ["load-api", "失败重试"]
  },
  virtual: {
    index: "05",
    title: "虚拟渲染",
    description: "12,000 个随机分支节点仍只渲染可视区域，也可以直接定位到 6 级目标。",
    eyebrow: "VIRTUAL LIST",
    tags: ["12,000 节点", "2-6 层", "快速定位"]
  },
  slots: {
    index: "06",
    title: "插槽定制",
    description: "组合 icon、label 与 append 插槽，构建更有辨识度的业务树。",
    eyebrow: "CUSTOM SLOTS",
    tags: ["图标", "业务标签"]
  }
};

export function isDemoScene(value: unknown): value is DemoScene {
  return typeof value === "string" && demoSceneKeys.includes(value as DemoScene);
}