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
  shortTitle: string;
  description: string;
  eyebrow: string;
  tags: string[];
}

export const demoSceneMeta: Record<DemoScene, DemoSceneMeta> = {
  basic: {
    index: "01",
    title: "基础交互",
    shortTitle: "基础",
    description: "展开节点、切换整行点击，并按需显示完整层级路径。",
    eyebrow: "EXPAND & PATH",
    tags: ["展开收起", "节点路径"]
  },
  selection: {
    index: "02",
    title: "选择策略",
    shortTitle: "选择",
    description: "在单选、父子联动和严格模式之间切换，实时查看选择结果。",
    eyebrow: "SELECTION",
    tags: ["v-model", "半选状态"]
  },
  filter: {
    index: "03",
    title: "搜索过滤",
    shortTitle: "搜索",
    description: "输入关键词快速定位节点，自动保留命中节点的祖先路径。",
    eyebrow: "FILTER",
    tags: ["关键词高亮", "空状态"]
  },
  "lazy-load": {
    index: "04",
    title: "按需加载",
    shortTitle: "懒加载",
    description: "展开区域节点时异步获取下一层数据，并反馈实时加载状态。",
    eyebrow: "ASYNC LOAD",
    tags: ["load-api", "状态反馈"]
  },
  virtual: {
    index: "05",
    title: "虚拟渲染",
    shortTitle: "大数据",
    description: "12,000 个随机分支节点仍只渲染可视区域，也可以直接定位到 6 级目标。",
    eyebrow: "VIRTUAL LIST",
    tags: ["12,000 节点", "2-6 层", "快速定位"]
  },
  slots: {
    index: "06",
    title: "插槽定制",
    shortTitle: "插槽",
    description: "组合 icon、label 与 append 插槽，构建更有辨识度的业务树。",
    eyebrow: "CUSTOM SLOTS",
    tags: ["图标", "业务标签"]
  }
};

export function isDemoScene(value: unknown): value is DemoScene {
  return typeof value === "string" && demoSceneKeys.includes(value as DemoScene);
}