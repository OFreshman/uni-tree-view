// playground 演示共用数据：同一份组织架构贯穿首页与 examples 各案例，
// 让「搜索、选择、弹窗」等场景之间的数据心智一致

export interface DemoTreeItem {
  id: string;
  label: string;
  /** 节点右侧附加文案（treeProps.append 映射演示用） */
  append?: string;
  /** 文档树的条目数徽标（append 插槽演示用） */
  count?: number;
  /** NEW 徽标（label 插槽演示用） */
  isNew?: boolean;
  disabled?: boolean;
  /** 懒加载演示的节点类型：region 可展开，city 为叶子 */
  type?: "region" | "city";
  children?: DemoTreeItem[];
}

export const demoTreeProps = {
  id: "id",
  label: "label",
  children: "children",
  disabled: "disabled"
};

export const orgTreeData: DemoTreeItem[] = [
  {
    id: "rd",
    label: "研发中心",
    children: [
      {
        id: "rd-fe",
        label: "前端组",
        children: [
          { id: "rd-fe-1", label: "顾宁" },
          { id: "rd-fe-2", label: "沈一舟" },
          { id: "rd-fe-3", label: "陆知行", disabled: true }
        ]
      },
      {
        id: "rd-be",
        label: "后端组",
        children: [
          { id: "rd-be-1", label: "江晚吟" },
          { id: "rd-be-2", label: "程叙" }
        ]
      },
      {
        id: "rd-design",
        label: "设计组",
        children: [
          { id: "rd-design-1", label: "苏合", isNew: true },
          { id: "rd-design-2", label: "白露" }
        ]
      }
    ]
  },
  {
    id: "pd",
    label: "产品部",
    children: [
      { id: "pd-1", label: "韩沉" },
      { id: "pd-2", label: "林晚" }
    ]
  },
  {
    id: "mk",
    label: "市场部",
    children: [
      { id: "mk-1", label: "周衍" }
    ]
  }
];

// 文档树：icon / label / append 插槽演示
export const docTreeData: DemoTreeItem[] = [
  {
    id: "doc-1",
    label: "项目文档",
    count: 8,
    children: [
      { id: "doc-1-1", label: "需求说明.md", isNew: true },
      { id: "doc-1-2", label: "接口文档.md", count: 3 }
    ]
  },
  {
    id: "doc-2",
    label: "设计资源",
    count: 2,
    children: [
      { id: "doc-2-1", label: "首页视觉稿.fig" }
    ]
  }
];

// 懒加载演示：区域为根，城市为叶子
export const lazyRegionData: DemoTreeItem[] = [
  { id: "north", label: "华北区域", append: "2 城市", type: "region" },
  { id: "east", label: "华东区域", append: "3 城市", type: "region" },
  { id: "south", label: "华南区域", append: "2 城市", type: "region" }
];

export const lazyRegionChildren: Record<string, DemoTreeItem[]> = {
  north: [
    { id: "beijing", label: "北京", type: "city" },
    { id: "tianjin", label: "天津", type: "city" }
  ],
  east: [
    { id: "shanghai", label: "上海", type: "city" },
    { id: "hangzhou", label: "杭州", type: "city" },
    { id: "suzhou", label: "苏州", type: "city" }
  ],
  south: [
    { id: "guangzhou", label: "广州", type: "city" },
    { id: "shenzhen", label: "深圳", type: "city" }
  ]
};

export function findTreeLabel(nodes: DemoTreeItem[], key: string | number): string | undefined {
  for (const node of nodes) {
    if (node.id === key) {
      return node.label;
    }
    if (node.children) {
      const found = findTreeLabel(node.children, key);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

export function findTreeLabels(nodes: DemoTreeItem[], keys: Array<string | number>): string[] {
  return keys
    .map((key) => findTreeLabel(nodes, key))
    .filter((label): label is string => Boolean(label));
}